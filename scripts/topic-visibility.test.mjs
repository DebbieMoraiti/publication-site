import assert from 'node:assert/strict';
import { test } from 'node:test';
import { topicIsActive, activeTopicArticles } from '../src/lib/topic-visibility.ts';
import { createTagIndex, publishedTagCatalog } from '../src/lib/tags.ts';

test('inactive topics hide their articles without modifying or deleting data, and can be restored', () => {
  const culture = { slug: 'culture', active: false };
  const topics = new Map([['culture', culture], ['music', { slug: 'music' }]]);
  const articles = [{ slug: 'hidden', topicSlug: 'culture', status: 'published', tags: ['culture-only'] }, { slug: 'visible', topicSlug: 'music', status: 'published' }];
  assert.equal(topicIsActive('culture', topics), false);
  assert.equal(topicIsActive('music', topics), true);
  assert.equal(topicIsActive('missing', topics), false);
  assert.deepEqual(activeTopicArticles(articles, topics), [articles[1]]);
  const tags = createTagIndex([{ slug: 'culture-only', label: { en: 'Culture only', el: 'Μόνο πολιτισμός' } }]);
  assert.deepEqual(publishedTagCatalog(activeTopicArticles(articles, topics), tags), []);
  assert.equal(articles.length, 2);
  assert.equal(articles[0].status, 'published');
  culture.active = true;
  assert.deepEqual(activeTopicArticles(articles, topics), articles);
  assert.equal(publishedTagCatalog(activeTopicArticles(articles, topics), tags)[0].slug, 'culture-only');
});
