import { articles, type Article } from './editorial';

export function visibleArticles() {
  // Publication status is independent of search-engine indexing.
  return articles.filter((article) => article.status === 'published');
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
  const relevance = (item: Article) =>
    (item.topicSlug === article.topicSlug ? 10 : 0) +
    (item.tags ?? []).filter((tag) => article.tags?.includes(tag)).length;
  return sortedVisibleArticles()
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => relevance(b) - relevance(a))
    .slice(0, limit);
}
