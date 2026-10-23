import assert from 'node:assert/strict';
import { test } from 'node:test';
import { submitContactForm } from '../src/lib/contact.ts';

const endpoint = 'https://formspree.io/f/test';
test('AJAX submits FormData without cookies or referrer and rejects navigation', async (t) => {
  const data = new FormData();
  data.set('email', 'test@example.invalid');
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.body, data);
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ ok: true });
  });
  await submitContactForm(endpoint, data);
  assert.equal(mock.mock.callCount(), 1);
});

test('HTTP errors, invalid responses and network failures cannot produce success', async (t) => {
  for (const response of [Response.json({ ok: false }), Response.json({ errors: [{ message: '<script>error</script>' }] }), Response.json({ ok: true, errors: ['error'] }), new Response('<html>challenge</html>'), ...[422, 429, 503].map((status) => Response.json({ error: 'Failed' }, { status }))]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(submitContactForm(endpoint, new FormData()));
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network error'); });
  await assert.rejects(submitContactForm(endpoint, new FormData()), /Network error/);
});

test('timeouts abort a pending request rather than leaving the form busy', async (t) => {
  let abort;
  const timer = t.mock.method(globalThis, 'setTimeout', (callback, delay) => { abort = callback; assert.equal(delay, 20000); return 1; });
  t.mock.method(globalThis, 'clearTimeout', () => {});
  t.mock.method(globalThis, 'fetch', async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
  const request = submitContactForm(endpoint, new FormData());
  abort();
  await assert.rejects(request, { name: 'AbortError' });
  assert.equal(timer.mock.callCount(), 1);
});
