import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildManifest, changedUrls } from './indexnow.mjs';

const origin = 'https://storyfields.gr';
const homepage = origin + '/';

test('IndexNow chooses new, changed and removed pages, not unchanged ones', () => {
  const before = { origin, pages: { [homepage]: 'old', [origin + '/removed/']: 'hash' } };
  const after = { origin, pages: { [homepage]: 'new', [origin + '/new/']: 'hash' } };
  assert.deepEqual(changedUrls(before, after), [homepage, origin + '/new/', origin + '/removed/']);
  assert.deepEqual(changedUrls(after, after), []);
  assert.deepEqual(changedUrls(null, after), [homepage, origin + '/new/']);
});

test('IndexNow sitemap manifest notices edits to HTML and images', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'indexnow-'));
  try {
    await mkdir(join(dist, 'articles', 'example'), { recursive: true });
    await mkdir(join(dist, 'images'));
    await writeFile(join(dist, 'sitemap.xml'), '<urlset><url><loc>' + homepage + '</loc></url><url><loc>' + origin + '/articles/example/</loc></url></urlset>');
    await writeFile(join(dist, 'index.html'), '<img src="/images/featured.webp">');
    await writeFile(join(dist, 'articles', 'example', 'index.html'), '<h1>Article</h1>');
    await writeFile(join(dist, 'images', 'featured.webp'), 'original');
    const first = await buildManifest(dist);
    await writeFile(join(dist, 'images', 'featured.webp'), 'updated');
    const second = await buildManifest(dist);
    assert.deepEqual(changedUrls(first, second), [homepage]);
    await writeFile(join(dist, 'articles', 'example', 'index.html'), '<h1>Updated</h1>');
    const third = await buildManifest(dist);
    assert.deepEqual(changedUrls(second, third), [origin + '/articles/example/']);
  } finally { await rm(dist, { force: true, recursive: true }); }
});

test('IndexNow forbids unrelated hosts and bad sitemap paths', async () => {
  assert.throws(() => changedUrls({ origin, pages: { 'https://untrusted.example/': 'hash' } }, { origin, pages: {} }));
  const dist = await mkdtemp(join(tmpdir(), 'indexnow-reject-'));
  try {
    await writeFile(join(dist, 'sitemap.xml'), '<urlset><url><loc>https://untrusted.example/</loc></url></urlset>');
    await assert.rejects(buildManifest(dist), /Unexpected sitemap URL/);
  } finally { await rm(dist, { force: true, recursive: true }); }
});
