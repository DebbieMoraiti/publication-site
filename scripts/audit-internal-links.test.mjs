import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkInternalLinks } from './audit-internal-links.mjs';

test('checks internal HTML fragments, including encoded IDs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'storyfields-links-'));
  try {
    await mkdir(join(root, 'article'));
    await writeFile(join(root, 'index.html'), '<a href="/article/#section">Good</a><a href="/article/#missing">Bad</a><a href="/article/#caf%C3%A9">Encoded</a>');
    await writeFile(join(root, 'article/index.html'), '<h2 id="section">Section</h2><h2 id="café">Coffee</h2>');
    const result = await checkInternalLinks(root);
    assert.equal(result.checked, 3);
    assert.equal(result.broken.length, 1);
    assert.match(result.broken[0], /#missing.*fragment not found/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
