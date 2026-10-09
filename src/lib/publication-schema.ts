import { absoluteUrl, languagePath, type LanguageCode } from '../i18n/routes';
import publication from '../content/publication.json';
import { siteConfig } from '../config';
import { topicBySlug } from '../content/editorial';

type Localized = { en: string; el: string };
type Author = {
  slug: string;
  name: string;
  role?: Localized;
  bio?: Localized;
  links?: { label?: string; url?: string }[];
};
type Article = {
  slug: string;
  type: string;
  status: string;
  date: string;
  author: string;
  topicSlug: string;
  tags?: string[];
  image?: string;
  title: Localized;
  dek: Localized;
  topic?: Localized;
};

function rootUrl() {
  return absoluteUrl('/');
}

function websiteId() {
  return `${rootUrl()}#website`;
}

function publisherId() {
  return `${rootUrl()}#publisher`;
}

function publicHttpsUrls(links: Author['links'] = []) {
  return [...new Set(links.flatMap((link) => {
    const value = link.url?.trim();
    if (!value) return [];
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? [url.href] : [];
    } catch {
      return [];
    }
  }))];
}

function publisherNode() {
  return {
    '@type': 'Organization',
    '@id': publisherId(),
    name: publication.identity.name,
    url: rootUrl(),
    logo: siteConfig.branding.logo ? absoluteUrl(siteConfig.branding.logo) : undefined,
  };
}

export function publicationWebsiteSchema(lang: LanguageCode) {
  const home = absoluteUrl(languagePath(lang));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'WebSite',
        '@id': websiteId(),
        url: rootUrl(),
        name: publication.identity.name,
        description: publication.identity.tagline[lang],
        publisher: { '@id': publisherId() },
        inLanguage: ['en', 'el'],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${home}#webpage`,
        url: home,
        name: publication.identity.name,
        description: publication.identity.tagline[lang],
        inLanguage: lang,
        isPartOf: { '@id': websiteId() },
        publisher: { '@id': publisherId() },
      },
    ],
  };
}

export function publicationCollectionSchema(
  lang: LanguageCode,
  page: string,
  name: string,
  description: string,
  pageType: 'CollectionPage' | 'ContactPage' = 'CollectionPage',
) {
  const home = absoluteUrl(languagePath(lang));
  const url = absoluteUrl(languagePath(lang, page));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'WebSite',
        '@id': websiteId(),
        url: rootUrl(),
        name: publication.identity.name,
        publisher: { '@id': publisherId() },
        inLanguage: ['en', 'el'],
      },
      {
        '@type': pageType,
        '@id': `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: lang,
        isPartOf: { '@id': websiteId() },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: publication.identity.name, item: home },
          { '@type': 'ListItem', position: 2, name, item: url },
        ],
      },
    ],
  };
}

export function publicationContactSchema(lang: LanguageCode, name: string, description: string) {
  return publicationCollectionSchema(lang, 'contact', name, description, 'ContactPage');
}

export function publicationAuthorSchema(lang: LanguageCode, author: Author) {
  const home = absoluteUrl(languagePath(lang));
  const url = absoluteUrl(languagePath(lang, `authors/${author.slug}`));
  const personId = `${url}#person`;
  const description = author.bio?.[lang] || author.role?.[lang] || author.name;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'WebSite',
        '@id': websiteId(),
        url: rootUrl(),
        name: publication.identity.name,
        publisher: { '@id': publisherId() },
        inLanguage: ['en', 'el'],
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: author.name,
        url,
        description,
        sameAs: publicHttpsUrls(author.links),
      },
      {
        '@type': 'ProfilePage',
        '@id': `${url}#webpage`,
        url,
        name: author.name,
        description,
        inLanguage: lang,
        isPartOf: { '@id': websiteId() },
        mainEntity: { '@id': personId },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: publication.identity.name, item: home },
          { '@type': 'ListItem', position: 2, name: author.name, item: url },
        ],
      },
    ],
  };
}

export function publicationArticleSchema(lang: LanguageCode, article: Article, author?: Author) {
  const home = absoluteUrl(languagePath(lang));
  const url = absoluteUrl(languagePath(lang, `articles/${article.slug}`));
  const authorUrl = author ? absoluteUrl(languagePath(lang, `authors/${author.slug}`)) : undefined;
  const topicUrl = absoluteUrl(languagePath(lang, `topics/${article.topicSlug}`));
  const topicLabel = topicBySlug.get(article.topicSlug)?.label[lang] ?? article.topic?.[lang] ?? article.topicSlug;
  const articleType = article.type === 'essay' ? 'Article' : 'BlogPosting';
  const articleImage = article.image?.startsWith('/') ? absoluteUrl(article.image) : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'WebSite',
        '@id': websiteId(),
        url: rootUrl(),
        name: publication.identity.name,
        publisher: { '@id': publisherId() },
        inLanguage: ['en', 'el'],
      },
      {
        '@type': articleType,
        '@id': `${url}#article`,
        url,
        headline: article.title[lang],
        description: article.dek[lang],
        datePublished: article.date,
        inLanguage: lang,
        keywords: article.tags ?? [],
        articleSection: topicLabel,
        image: articleImage,
        isPartOf: { '@id': websiteId() },
        publisher: { '@id': publisherId() },
        mainEntityOfPage: { '@id': `${url}#webpage` },
        author: author ? {
          '@type': 'Person',
          '@id': `${authorUrl}#person`,
          name: author.name,
          url: authorUrl,
        } : undefined,
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: article.title[lang],
        description: article.dek[lang],
        inLanguage: lang,
        isPartOf: { '@id': websiteId() },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: publication.identity.name, item: home },
          { '@type': 'ListItem', position: 2, name: topicLabel, item: topicUrl },
          { '@type': 'ListItem', position: 3, name: article.title[lang], item: url },
        ],
      },
    ],
  };
}
