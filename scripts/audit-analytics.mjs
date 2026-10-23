import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';

const loader = await readFile('dist/scripts/web-analytics.js', 'utf8');
// Execute the actual loader with production, preview and duplicate scenarios.
for (const [hostname, protocol, existing, expected] of [
  ['storyfields.gr', 'https:', false, 1], ['www.storyfields.gr', 'https:', false, 1],
  ['storyfields.gr', 'http:', false, 0], ['localhost', 'https:', false, 0],
  ['debbiemoraiti.github.io', 'https:', false, 0], ['preview.workers.dev', 'https:', false, 0],
  ['storyfields.gr.attacker.invalid', 'https:', false, 0], ['storyfields.gr', 'https:', true, 0],
]) {
  const appended = [];
  const document = {
    querySelector: () => existing ? {} : null,
    createElement: () => ({ setAttribute(name, value) { this[name] = value; } }),
    body: { append: (script) => appended.push(script) },
  };
  vm.runInNewContext(loader, { location: { hostname, protocol }, document });
  assert.equal(appended.length, expected, `${protocol}//${hostname}`);
  if (expected) {
    assert.equal(appended[0].type, 'module');
    assert.equal(appended[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
    assert.deepEqual(JSON.parse(appended[0]['data-cf-beacon']), { token: 'aa17bcd1cab7417b93b1e127a7c56302' });
  }
}

const headers = await readFile('dist/_headers', 'utf8');
const policy = headers.match(/Content-Security-Policy: (.+)/)[1];
const metaPolicy = policy.replace(/; frame-ancestors 'none'$/, '');
assert.ok(policy.includes('https://static.cloudflareinsights.com/beacon.min.js'));
assert.ok(policy.includes('https://cloudflareinsights.com/cdn-cgi/rum'));
assert.ok(!/script-src[^;]*(?:unsafe-inline|unsafe-eval|\*)/.test(policy));
let count = 0;
async function audit(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { await audit(file); continue; }
    if (!file.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    if (path.basename(file).startsWith('google') && /^google-site-verification: [\w.-]+\s*$/.test(html)) continue;
    const metas = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/g)];
    assert.equal(metas.length, 1, `Exactly one meta CSP required: ${file}`);
    assert.equal(metas[0][1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'), metaPolicy);
    assert.ok(html.indexOf(metas[0][0]) < html.search(/<(?:script|link)\b/i), `CSP must precede resources: ${file}`);
    assert.ok(html.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'));
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/.test(match[1]) || /application\/ld\+json/i.test(match[1]) || !match[2]) continue;
      const hash = createHash('sha256').update(match[2]).digest('base64');
      assert.ok(metaPolicy.includes(`'sha256-${hash}'`), `Unapproved inline script: ${file}`);
    }
    const loaders = [...html.matchAll(/<script\b[^>]*src="[^"]*\/scripts\/web-analytics\.js"[^>]*>/g)];
    const noindex = /<meta\b[^>]*name="robots"[^>]*content="noindex/.test(html);
    assert.equal(loaders.length, noindex ? 0 : 1, `Analytics excluded from non-public pages: ${file}`);
    assert.ok(!/\b(?:document\.cookie|localStorage|sessionStorage)\b/.test(loader));
    count++;
  }
}
await audit('dist');
console.log(`Analytics host guards, duplicate protection and effective CSP passed for ${count} HTML pages.`);
