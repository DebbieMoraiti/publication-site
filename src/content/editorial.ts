export type LanguageCode = 'en' | 'el';
export type Localized = { en: string; el: string };

export type ArticleSection = {
  type: 'paragraph' | 'heading' | 'quote';
  text: Localized;
  attribution?: Localized;
};

export type Article = {
  slug: string;
  type: 'feature' | 'profile' | 'essay' | 'interview' | 'review' | 'update';
  status: 'draft' | 'published';
  featured: boolean;
  date: string;
  author: string;
  topicSlug: string;
  tags?: string[];
  title: Localized;
  dek: Localized;
  topic?: Localized;
  image?: string;
  imageAlt?: Partial<Localized>;
  sections?: ArticleSection[];
  body?: { en?: string[]; el?: string[] };
};

export type Author = {
  slug: string;
  name: string;
  role?: Localized;
  bio?: Localized;
  links?: { label?: string; url?: string }[];
};

export type Topic = {
  slug: string;
  label: Localized;
};

const articleModules = import.meta.glob('./articles/*.json', { eager: true, import: 'default' }) as Record<string, Article>;
const authorModules = import.meta.glob('./authors/*.json', { eager: true, import: 'default' }) as Record<string, Author>;
const topicModules = import.meta.glob('./topics/*.json', { eager: true, import: 'default' }) as Record<string, Topic>;

export const articles = Object.values(articleModules);
export const authors = Object.values(authorModules);
export const topics = Object.values(topicModules);

export const authorBySlug = new Map(authors.map((author) => [author.slug, author]));
export const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
