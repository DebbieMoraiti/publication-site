import { articles, authors, topics } from './editorial';

const slugPattern = /^[a-z0-9-]+$/;
const tagPattern = /^[a-z0-9-]+$/;
const articleTypes = new Set(['feature', 'profile', 'essay', 'interview', 'review', 'update']);
const sectionTypes = new Set(['paragraph', 'heading', 'quote']);

function unique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!slugPattern.test(value)) throw new Error(`Invalid ${label} slug: ${value}`);
    if (seen.has(value)) throw new Error(`Duplicate ${label} slug: ${value}`);
    seen.add(value);
  }
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
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

  for (const author of authors) {
    requiredText(author.name, `Author "${author.slug}" name`);
    for (const link of author.links ?? []) {
      if (!link.url) continue;
      try {
        const url = new URL(link.url);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch {
        throw new Error(`Author "${author.slug}" has an invalid public HTTPS link.`);
      }
    }
  }

  for (const topic of topics) {
    requiredText(topic.label.en, `Topic "${topic.slug}" English label`);
    requiredText(topic.label.el, `Topic "${topic.slug}" Greek label`);
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
    if (!articleTypes.has(article.type)) {
      throw new Error(`Article "${article.slug}" has invalid type "${article.type}".`);
    }
    if (!validDate(article.date)) {
      throw new Error(`Article "${article.slug}" must use a real YYYY-MM-DD date.`);
    }

    requiredText(article.title.en, `Article "${article.slug}" English title`);
    requiredText(article.title.el, `Article "${article.slug}" Greek title`);
    requiredText(article.dek.en, `Article "${article.slug}" English summary`);
    requiredText(article.dek.el, `Article "${article.slug}" Greek summary`);

    const tags = article.tags ?? [];
    const seenTags = new Set<string>();
    for (const tag of tags) {
      if (!tagPattern.test(tag)) {
        throw new Error(`Article "${article.slug}" has invalid tag "${tag}". Use lowercase Latin letters, digits and hyphens.`);
      }
      if (seenTags.has(tag)) {
        throw new Error(`Article "${article.slug}" contains duplicate tag "${tag}".`);
      }
      seenTags.add(tag);
    }

    if (article.image?.trim()) {
      if (!article.image.startsWith('/uploads/')) {
        throw new Error(`Article "${article.slug}" image must come from /uploads/.`);
      }
      requiredText(article.imageAlt?.en, `Article "${article.slug}" English image alt text`);
      requiredText(article.imageAlt?.el, `Article "${article.slug}" Greek image alt text`);
    }

    for (const [index, section] of (article.sections ?? []).entries()) {
      if (!sectionTypes.has(section.type)) {
        throw new Error(`Article "${article.slug}" section ${index + 1} has invalid type "${section.type}".`);
      }
      requiredText(section.text?.en, `Article "${article.slug}" section ${index + 1} English text`);
      requiredText(section.text?.el, `Article "${article.slug}" section ${index + 1} Greek text`);
    }

    if (article.status === 'published') {
      const hasStructuredContent = (article.sections?.length ?? 0) > 0;
      const hasLegacyEnglish = (article.body?.en?.length ?? 0) > 0;
      const hasLegacyGreek = (article.body?.el?.length ?? 0) > 0;
      if (!hasStructuredContent && (!hasLegacyEnglish || !hasLegacyGreek)) {
        throw new Error(`Published article "${article.slug}" must contain English and Greek article content.`);
      }
    }
  }
}
