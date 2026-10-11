import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { createTagIndex, resolveArticleTags, publishedTagCatalog, articleTagDisplayLimit } from '../src/lib/tags.ts';

const metal = { slug: 'metal', label: { en: 'Heavy metal', el: 'Heavy metal' }, aliases: ['heavy-metal'] };
const cats = { slug: 'cats', label: { en: 'Cats', el: 'Γάτες' } };
const index = createTagIndex([metal, cats]);

test('stable canonical IDs and legacy aliases share the bilingual definition', () => {
  assert.equal(index.get('heavy-metal'), index.get('metal'));
  assert.equal(index.get('cats').label.el, 'Γάτες');
  assert.deepEqual(resolveArticleTags(['cats', 'heavy-metal'], index), [cats, metal]);
});

test('missing tags are optional, unknown IDs fail rather than silently disappearing', () => {
  assert.deepEqual(resolveArticleTags(undefined, index), []);
  assert.throws(() => resolveArticleTags(['cat'], index), /Unknown tag/);
});

test('duplicate references and synonymous aliases are rejected', () => {
  assert.throws(() => resolveArticleTags(['cats', 'cats'], index), /Duplicate article tag/);
  assert.throws(() => resolveArticleTags(['metal', 'heavy-metal'], index), /Duplicate article tag/);
});

test('tag catalog rejects missing labels, invalid slugs and alias collisions', () => {
  for (const lang of ['en', 'el']) {
    assert.throws(() => createTagIndex([{ ...cats, label: { ...cats.label, [lang]: ' ' } }]), /requires/);
  }
  for (const slug of ['Cats', '../cats', 'γάτες', '<script>', '']) {
    assert.throws(() => createTagIndex([{ ...cats, slug }]), /Invalid tag slug/);
  }
  assert.throws(() => createTagIndex([cats, cats]), /Duplicate tag slug/);
  assert.throws(() => createTagIndex([metal, { ...cats, slug: 'heavy-metal' }]), /Duplicate tag slug/);
  assert.throws(() => createTagIndex([{ ...cats, aliases: ['cats'] }]), /Duplicate tag slug/);
});

test('all repository articles resolve against the shared catalog', () => {
  const load = (directory) => readdirSync(directory).filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(`${directory}/${file}`, 'utf8')));
  const catalog = createTagIndex(load('src/content/tags'));
  for (const article of load('src/content/articles')) {
    assert.equal(resolveArticleTags(article.tags, catalog).length, article.tags?.length ?? 0);
  }
  assert.equal(articleTagDisplayLimit, 4);
});

test('draft-only tags stay out of the public catalog; aliases cannot create duplicate pages', () => {
  const articles = [
    { status: 'draft', tags: ['cats'] },
    { status: 'published', tags: ['heavy-metal'] },
    { status: 'published', tags: ['metal'] },
    { status: 'published' },
  ];
  assert.deepEqual(publishedTagCatalog(articles, index), [metal]);
  assert.deepEqual(publishedTagCatalog([], index), []);
});
