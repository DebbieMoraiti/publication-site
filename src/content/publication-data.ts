import { articles, topics, topicBySlug, tagBySlug, type Article } from './editorial';
import { resolveArticleTags, publishedTagCatalog } from '../lib/tags';
import { activeTopicArticles } from '../lib/topic-visibility';

export function activeTopics() {
  return topics.filter((topic) => topic.active !== false);
}

export function articleTags(article: Article) {
  return resolveArticleTags(article.tags, tagBySlug);
}

export function publicTags() {
  return publishedTagCatalog(allArticles(), tagBySlug);
}

export function publicTagPaths() {
  return publicTags().flatMap((tag) => [tag.slug, ...(tag.aliases ?? [])]);
}

export function allArticles() {
  return activeTopicArticles(articles, topicBySlug);
}

export function visibleArticles() {
  // Inactive topics remain stored but have no routes, listings, feeds or taxonomy links.
  return allArticles().filter((article) => article.status === 'published');
}

export function sortedVisibleArticles() {
  return [...visibleArticles()].sort((a, b) =>
    b.date.localeCompare(a.date) || a.title.en.localeCompare(b.title.en),
  );
}

export function articleNeighbors(article: Article) {
  const ordered = sortedVisibleArticles();
  const index = ordered.findIndex((item) => item.slug === article.slug);
  return {
    newer: index > 0 ? ordered[index - 1] : undefined,
    older: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}

export function relatedArticles(article: Article, limit = 3) {
  const currentTags = new Set(articleTags(article).map((tag) => tag.slug));
  const relevance = (item: Article) =>
    (item.topicSlug === article.topicSlug ? 10 : 0) +
    articleTags(item).filter((tag) => currentTags.has(tag.slug)).length;
  return sortedVisibleArticles()
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => relevance(b) - relevance(a))
    .slice(0, limit);
}
