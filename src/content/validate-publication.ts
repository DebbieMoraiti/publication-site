import { articles, authors, topics } from './editorial';

const slugPattern = /^[a-z0-9-]+$/;

function unique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!slugPattern.test(value)) throw new Error(`Invalid ${label} slug: ${value}`);
    if (seen.has(value)) throw new Error(`Duplicate ${label} slug: ${value}`);
    seen.add(value);
  }
}

export function validatePublicationContent() {
  unique(authors.map((author) => author.slug), 'author');
  unique(topics.map((topic) => topic.slug), 'topic');
  unique(articles.map((article) => article.slug), 'article');

  const authorSlugs = new Set(authors.map((author) => author.slug));
  const topicSlugs = new Set(topics.map((topic) => topic.slug));
  const featured = articles.filter((article) => article.featured);

  if (featured.length > 1) {
    throw new Error('Only one article may be featured on the homepage.');
  }

  for (const article of articles) {
    if (!authorSlugs.has(article.author)) {
      throw new Error(`Article "${article.slug}" references unknown author "${article.author}".`);
    }
    if (!topicSlugs.has(article.topicSlug)) {
      throw new Error(`Article "${article.slug}" references unknown topic "${article.topicSlug}".`);
    }
    if (!['draft', 'published'].includes(article.status)) {
      throw new Error(`Article "${article.slug}" has invalid status "${article.status}".`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
      throw new Error(`Article "${article.slug}" must use YYYY-MM-DD date format.`);
    }
  }
}
