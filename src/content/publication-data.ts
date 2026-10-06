import { siteConfig } from '../config';
import { articles } from './editorial';

export function visibleArticles() {
  return siteConfig.seo.indexable
    ? articles.filter((article) => article.status === 'published')
    : articles;
}
