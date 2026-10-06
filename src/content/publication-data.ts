import { siteConfig } from '../config';
import { articles, type Article } from './editorial';

export function visibleArticles() {
  return siteConfig.seo.indexable
    ? articles.filter((article) => article.status === 'published')
    : articles;
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

export function moreFromTopic(article: Article, limit = 3) {
  return sortedVisibleArticles()
    .filter((item) => item.slug !== article.slug && item.topicSlug === article.topicSlug)
    .slice(0, limit);
}
