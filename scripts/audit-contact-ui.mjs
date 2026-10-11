import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Serve the actual build and its CSP. Every provider request is intercepted;
// these checks never send email or submit data to the real service.
const site = JSON.parse(await readFile('src/config/site.json', 'utf8'));
const endpoint = site.contact.formEndpoint;
assert.ok(endpoint, 'Contact UI audit requires the configured form endpoint');
const root = path.resolve('dist');
const csp = (await readFile('dist/_headers', 'utf8')).match(/Content-Security-Policy: (.+)/)[1];
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const route = decodeURIComponent(url.pathname);
    const file = path.resolve(root, `.${route.endsWith('/') ? `${route}index.html` : route}`);
    if (!file.startsWith(`${root}/`)) throw new Error();
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Content-Security-Policy': csp });
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const chrome = spawn(process.env.CHROME_PATH || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=9223', '--user-data-dir=/tmp/storyfields-contact-ui', 'about:blank'], { stdio: 'ignore' });
let startupError;
chrome.on('error', (error) => { startupError = error; });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (startupError) throw startupError;
    try { target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json(); break; }
    catch { await delay(100); }
  }
  assert.ok(target?.webSocketDebuggerUrl, 'Chrome did not start');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  let mode = 'hold';
  let requests = [];
  const held = [];
  const mockErrors = [];
  const fulfill = (id, status = 200, body = JSON.stringify({ ok: true })) => send('Fetch.fulfillRequest', {
    requestId: id, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }],
    body: Buffer.from(body).toString('base64'),
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      requests.push(request);
      if (mode === 'hold') held.push(requestId);
      else (mode === 'network' ? send('Fetch.failRequest', { requestId, errorReason: 'Failed' })
        : fulfill(requestId, mode === 'error' ? 422 : 200, mode === 'malformed' ? '<html>challenge</html>' : mode === 'unconfirmed' ? '{"ok":false}' : mode === 'error' ? '{"errors":[{"message":"<script>unsafe</script>"}]}' : '{"ok":true}')).catch((error) => mockErrors.push(error));
      return;
    }
    const operation = pending.get(message.id);
    if (!operation) return;
    pending.delete(message.id);
    if (message.error) operation.reject(new Error(message.error.message)); else operation.resolve(message.result);
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if (await evaluate(expression)) return; } catch {}
      await delay(100);
    }
    throw new Error(`UI condition timed out: ${expression}`);
  };
  const fill = () => evaluate(`(() => {
    document.querySelector('#contact-name').value = 'Test Reader';
    document.querySelector('#contact-email').value = 'test@example.invalid';
    document.querySelector('#contact-subject').value = 'Δοκιμή';
    document.querySelector('#contact-message').value = 'Preserve this message — δοκιμή.';
    document.querySelector('.contact-form button').focus();
  })()`);
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: `${endpoint}*`, requestStage: 'Request' }] });
  await mkdir('responsive-reports', { recursive: true });
  let checks = 0;
  for (const lang of ['el', 'en']) {
    for (const width of [320, 390, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      const url = `${base}/${lang === site.localization.defaultLanguage ? '' : `${lang}/`}contact/`;
      await send('Page.navigate', { url });
      await waitFor(`location.href === ${JSON.stringify(url)} && document.querySelector('.contact-form')?.dataset.contactEnhanced === 'true'`);
      requests = []; mode = 'hold';
      await evaluate(`document.querySelector('.contact-form').requestSubmit()`);
      assert.equal(requests.length, 0, 'Empty form must not submit');
      await fill();
      await evaluate(`document.querySelector('#contact-email').value = 'invalid'; document.querySelector('.contact-form').requestSubmit()`);
      assert.equal(requests.length, 0, 'Invalid email must not submit');
      await fill();
      await evaluate(`document.querySelector('.contact-honeypot input').value = 'bot'; document.querySelector('.contact-form').requestSubmit()`);
      assert.equal(requests.length, 0, 'Honeypot must not submit or show success');
      await evaluate(`document.querySelector('.contact-honeypot input').value = ''; document.querySelector('.contact-form').requestSubmit()`);
      await waitFor(`document.querySelector('.contact-form').getAttribute('aria-busy') === 'true'`);
      for (let attempt = 0; held.length === 0 && attempt < 80; attempt++) await delay(100);
      assert.equal(held.length, 1, 'One mocked submission expected');
      await evaluate(`document.querySelector('.contact-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`);
      assert.equal(requests.length, 1, 'In-flight duplicate must be ignored');
      assert.equal(requests[0].method, 'POST');
      assert.equal(await evaluate(`document.querySelector('.contact-dialog').open`), false, 'No premature success');
      await fulfill(held.shift());
      await waitFor(`document.querySelector('.contact-dialog').open && !document.querySelector('.contact-form').hasAttribute('aria-busy')`);
      const metrics = await evaluate(`(() => {
        const dialog = document.querySelector('.contact-dialog'), box = dialog.getBoundingClientRect();
        return { url: location.href, width: innerWidth, scroll: document.documentElement.scrollWidth,
          left: box.left, right: box.right, dialogScroll: dialog.scrollWidth, dialogWidth: dialog.clientWidth,
          title: dialog.querySelector('h2').textContent, focus: document.activeElement.className,
          background: getComputedStyle(dialog).backgroundColor, pageBackground: getComputedStyle(document.body).backgroundColor,
          font: getComputedStyle(dialog.querySelector('h2')).fontFamily, pageFont: getComputedStyle(document.querySelector('.contact-correspondence h2')).fontFamily,
          empty: !document.querySelector('#contact-message').value };
      })()`);
      assert.equal(metrics.url, url, 'Success must not navigate');
      assert.equal(metrics.background, metrics.pageBackground);
      assert.equal(metrics.font, metrics.pageFont);
      assert.equal(metrics.title, lang === 'el' ? 'Το μήνυμά σου στάλθηκε' : 'Your message has been sent');
      assert.equal(metrics.focus, 'contact-dialog-close');
      assert.ok(metrics.empty && metrics.left >= 0 && metrics.right <= width && metrics.scroll <= width && metrics.dialogScroll <= metrics.dialogWidth);
      if (width === 390 || width === 1440) {
        const screenshot = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(`responsive-reports/${lang}-contact-success-${width}.png`, Buffer.from(screenshot.data, 'base64'));
      }
      if (width === 320) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      } else await evaluate(`document.querySelector('.contact-dialog-close').click()`);
      await waitFor(`!document.querySelector('.contact-dialog').open && document.activeElement === document.querySelector('.contact-form button')`);
      for (const failure of width === 320 ? ['error', 'network', 'malformed', 'unconfirmed'] : ['error']) {
        mode = failure; await fill();
        await evaluate(`document.querySelector('.contact-form').requestSubmit()`);
        await waitFor(`document.querySelector('.contact-status').dataset.error === 'true' && !document.querySelector('.contact-form').hasAttribute('aria-busy')`);
        assert.equal(await evaluate(`document.querySelector('.contact-dialog').open`), false);
        assert.equal(await evaluate(`document.querySelector('#contact-message').value`), 'Preserve this message — δοκιμή.');
        assert.equal(await evaluate(`location.href`), url);
        assert.equal(await evaluate(`document.querySelector('.contact-form button').disabled`), false);
        checks++;
      }
      checks++;
    }
  }
  assert.deepEqual(mockErrors, []);
  console.log(`Contact UI passed ${checks} bilingual desktop/mobile success/error checks, validation, spam/duplicate protection, focus, theme and no-navigation behavior. No real email was sent.`);
} finally {
  socket?.close(); chrome.kill('SIGTERM'); server.close();
}
