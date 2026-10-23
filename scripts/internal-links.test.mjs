import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getInternalTargets, checkInternalLinks } from './audit-internal-links.mjs';

const site = 'https://storyfields.gr';

test('resolves relative, localized, asset, query and escaped-link targets', () => {
  const html = '<a href="../">Back</a><a href="/el/contact/?a=1&amp;b=2#part">Contact</a><a href="/uploads/photo.webp">Image</a><a href="#intro">Anchor</a><a href="https://example.com/out">External</a><a href="mailto:hi@example.com">Mail</a>';
  const actual = getInternalTargets(html, '/el/articles/story/', site);
  assert.deepEqual(actual.map(item => item.candidates), [
    ['el/articles/index.html'], ['el/contact/index.html'], ['uploads/photo.webp', 'uploads/photo.webp/index.html'], ['el/articles/story/index.html'],
  ]);
});

test('rejects unsafe schemes and noncanonical HTTP links to this site', () => {
  const actual = getInternalTargets('<a href="javascript:alert(1)">Bad</a><a href="http://storyfields.gr/">HTTP</a>', '/', site);
  assert.deepEqual(actual.map(item => item.error), ['Unsupported link protocol javascript:', 'Non-HTTPS link to our own site']);
});

test('detects a broken route but permits valid pages and uploaded media', async () => {
  const root = await mkdtemp(join(tmpdir(), 'storyfields-internal-links-'));
  try {
    await mkdir(join(root, 'el', 'contact'), { recursive: true });
    await mkdir(join(root, 'uploads'), { recursive: true });
    await writeFile(join(root, 'index.html'), '<a href="/el/contact/">Contact</a><a href="/uploads/pic.svg">Media</a><a href="/missing/">Missing</a>');
    await writeFile(join(root, 'el/contact/index.html'), '<a href="/">Home</a><a href="./">Self</a>');
    await writeFile(join(root, 'uploads/pic.svg'), '<svg/>');
    const result = await checkInternalLinks(root, site);
    assert.equal(result.pages, 2);
    assert.equal(result.checked, 5);
    assert.equal(result.broken.length, 1);
    assert.match(result.broken[0], /\/missing\//);
  } finally { await rm(root, { recursive: true, force: true }); }
});
