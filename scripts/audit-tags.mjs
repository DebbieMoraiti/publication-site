import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createTagIndex, resolveArticleTags, articleTagDisplayLimit } from '../src/lib/tags.ts';
import { activeTopicArticles } from '../src/lib/topic-visibility.ts';

const load = (directory) => readdirSync(directory).filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(`${directory}/${file}`, 'utf8')));
const tags = load('src/content/tags');
const index = createTagIndex(tags);
const topicIndex = new Map(load('src/content/topics').map((topic) => [topic.slug, topic]));
const articles = activeTopicArticles(load('src/content/articles'), topicIndex);
const published = articles.filter((article) => article.status === 'published');
const publicSlugs = new Set(published.flatMap((article) => resolveArticleTags(article.tags, index).map((tag) => tag.slug)));
const config = JSON.parse(readFileSync('src/config/site.json', 'utf8'));
const base = (process.env.PUBLIC_BASE_PATH || '/').replace(/\/$/, '');
const path = (lang, page) => `${base}/${lang === config.localization.defaultLanguage ? '' : `${lang}/`}${page}/`;
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
let checked = 0;

for (const lang of ['el', 'en']) {
  for (const article of articles) {
    const route = path(lang, `articles/${article.slug}`);
    const html = readFileSync(`dist${route.slice(base.length)}index.html`, 'utf8');
    const header = html.match(/<ul class="article-tags"[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '';
    const expected = resolveArticleTags(article.tags, index).filter((tag) => publicSlugs.has(tag.slug)).slice(0, articleTagDisplayLimit);
    const anchors = [...header.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)];
    assert.equal(anchors.length, expected.length, `${route}: displayed tag count`);
    anchors.forEach(([_, href, text], i) => {
      assert.equal(href, path(lang, `tags/${expected[i].slug}`));
      assert.equal(text, escape(expected[i].label[lang]));
      assert.ok(existsSync(`dist${href.slice(base.length)}index.html`), `${route}: broken tag link`);
    });
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const node = schema['@graph'].find((node) => node.keywords);
    assert.deepEqual(node.keywords, resolveArticleTags(article.tags, index).map((tag) => tag.label[lang]));
    checked++;
  }
  for (const tag of tags) {
    for (const slug of [tag.slug, ...(tag.aliases ?? [])]) {
      const route = path(lang, `tags/${slug}`);
      const file = `dist${route.slice(base.length)}index.html`;
      if (!publicSlugs.has(tag.slug)) {
        assert.ok(!existsSync(file), `${route}: unused/draft-only tag page`);
        continue;
      }
      const html = readFileSync(file, 'utf8');
      assert.ok(html.includes(`<h1>#${escape(tag.label[lang])}</h1>`), `${route}: localized heading`);
      assert.ok(html.includes(`rel="canonical" href="${config.seo.siteUrl}${path(lang, `tags/${tag.slug}`)}"`), `${route}: canonical`);
      const listing = html.match(/<div class="taxonomy-list">([\s\S]*?)<\/div>/)[1];
      const links = [...listing.matchAll(/<h2><a href="([^"]+)"/g)].map((match) => match[1]);
      const expected = published.filter((article) => resolveArticleTags(article.tags, index).some((item) => item.slug === tag.slug));
      assert.deepEqual(links.sort(), expected.map((article) => path(lang, `articles/${article.slug}`)).sort());
      checked++;
    }
  }
}
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
for (const tag of tags) {
  for (const lang of ['en', 'el']) {
    assert.equal(sitemap.includes(`<loc>${config.seo.siteUrl}${path(lang, `tags/${tag.slug}`)}</loc>`), publicSlugs.has(tag.slug));
    for (const alias of tag.aliases ?? []) assert.ok(!sitemap.includes(`/tags/${alias}/`));
  }
}
console.log(`Tag audit passed: ${checked} bilingual article/tag pages, localized labels, matching published stories, preserved aliases and canonical sitemap.`);
