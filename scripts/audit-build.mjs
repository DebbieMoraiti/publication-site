import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const site = JSON.parse(await readFile('src/config/site.json', 'utf8'));
const base = (process.env.PUBLIC_SITE_URL || site.seo.siteUrl).replace(/\/$/, '');
const indexable = site.seo.indexable === true;
const [headers, robots, sitemap] = await Promise.all([
  readFile('dist/_headers', 'utf8'),
  readFile('dist/robots.txt', 'utf8'),
  readFile('dist/sitemap.xml', 'utf8'),
]);
assert.match(headers, /Content-Security-Policy:/, 'Missing generated CSP');
assert.equal(/X-Robots-Tag:.*noindex/i.test(headers), !indexable, 'Global indexing header differs from configuration');
const formOrigin = site.contact.formEndpoint ? new URL(site.contact.formEndpoint).origin : "'none'";
assert.ok(headers.includes(`form-action ${formOrigin};`), 'CSP must allow only the configured form origin');
assert.match(headers, /connect-src 'self';/, 'Contact must not need third-party background requests');
assert.ok(robots.includes(indexable ? 'Allow: /' : 'Disallow: /'), 'Robots crawl policy differs from configuration');
assert.equal(robots.includes('Disallow: /'), !indexable, 'Unexpected global crawl block');
assert.ok(robots.includes(`Sitemap: ${base}/sitemap.xml`), 'Missing canonical sitemap in robots');

const files = (await readdir('src/content/articles')).filter((file) => file.endsWith('.json'));
const articles = await Promise.all(files.map(async (file) => JSON.parse(await readFile(`src/content/articles/${file}`, 'utf8'))));
const drafts = articles.filter((article) => article.status !== 'published');
const previewPaths = new Set(['image-preview/index.html']);
for (const draft of drafts) {
  assert.ok(!sitemap.includes(`/articles/${draft.slug}/`), 'Draft must not appear in sitemap');
  for (const language of site.localization.languages) {
    const prefix = language.code === site.localization.defaultLanguage ? '' : `${language.code}/`;
    previewPaths.add(`${prefix}articles/${draft.slug}/index.html`);
  }
}
assert.ok(!sitemap.includes('/image-preview/'), 'Image preview must not appear in sitemap');

async function htmlFiles(folder) {
  const found = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) found.push(...await htmlFiles(file));
    else if (entry.name.endsWith('.html')) found.push(file);
  }
  return found;
}

const pages = await htmlFiles('dist');
const documents = new Map();
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const route = path.relative('dist', file).split(path.sep).join('/');
  const robotsMeta = html.match(/<meta\b[^>]*name="robots"[^>]*>/i)?.[0] || '';
  const blocked = /\b(?:noindex|none)\b/i.test(robotsMeta);
  assert.equal(blocked, !indexable || previewPaths.has(route), `Incorrect indexing metadata: ${route}`);
  documents.set(route, html);
}
for (const route of previewPaths) assert.ok(documents.has(route), `Missing protected preview: ${route}`);

const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(locations.length > 0, 'Empty sitemap');
for (const location of locations) {
  const url = new URL(location);
  assert.equal(url.origin, new URL(base).origin, 'Sitemap URL uses a different origin');
  const route = `${url.pathname.replace(/^\//, '')}index.html`;
  const html = documents.get(route);
  assert.ok(html, `Sitemap URL has no built page: ${location}`);
  assert.ok(!previewPaths.has(route), `Preview in sitemap: ${location}`);
  assert.ok(html.includes(`rel="canonical" href="${location}"`), `Canonical differs from sitemap: ${location}`);
}

for (const language of site.localization.languages) {
  const prefix = language.code === site.localization.defaultLanguage ? '' : `${language.code}/`;
  const html = documents.get(`${prefix}contact/index.html`);
  assert.ok(html, `Missing Contact page: ${language.code}`);
  if (site.contact.formEndpoint) {
    assert.ok(html.includes(`action="${site.contact.formEndpoint}" method="post"`), 'Contact must use native POST to the approved endpoint');
    assert.ok(html.includes('data-contact-mode="endpoint"'), 'Contact endpoint mode is missing');
    assert.ok(!/<fieldset\b[^>]*\bdisabled\b/.test(html), 'Contact fields must work without JavaScript');
    assert.ok(!/<button\b[^>]*\bdisabled\b/.test(html), 'Contact submission must work without JavaScript');
    assert.ok(html.includes(`name="${site.contact.honeypotField}" tabindex="-1" autocomplete="off"`), 'Missing provider honeypot');
  }
}

console.log(`Built indexing, preview protection, sitemap and Contact audit passed for ${pages.length} HTML pages (${locations.length} sitemap URLs).`);
