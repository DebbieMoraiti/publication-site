import { absoluteUrl, languagePath, type LanguageCode } from '../i18n/routes';
import publication from '../content/publication.json';

type Localized = { en: string; el: string };
type Author = { slug: string; name: string; role?: Localized; bio?: Localized };
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
  topic: Localized;
};

export function publicationWebsiteSchema(lang: LanguageCode) {
  const home = absoluteUrl(languagePath(lang));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        url: home,
        name: publication.identity.name,
        description: publication.identity.tagline[lang],
        inLanguage: lang,
      },
      {
        '@type': 'CollectionPage',
        '@id': `${home}#webpage`,
        url: home,
        name: publication.identity.name,
        description: publication.identity.tagline[lang],
        inLanguage: lang,
        isPartOf: { '@id': `${home}#website` },
      },
    ],
  };
}

export function publicationArticleSchema(lang: LanguageCode, article: Article, author?: Author) {
  const home = absoluteUrl(languagePath(lang));
  const url = absoluteUrl(languagePath(lang, `articles/${article.slug}`));
  const authorUrl = author ? absoluteUrl(languagePath(lang, `authors/${author.slug}`)) : undefined;
  const topicUrl = absoluteUrl(languagePath(lang, `topics/${article.topicSlug}`));
  const articleType = article.type === 'essay' ? 'Article' : 'BlogPosting';
  const articleImage = article.image?.startsWith('/') ? absoluteUrl(article.image) : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        url: home,
        name: publication.identity.name,
        inLanguage: lang,
      },
      {
        '@type': articleType,
        '@id': `${url}#article`,
        url,
        headline: article.title[lang],
        description: article.dek[lang],
        datePublished: article.date,
        dateModified: article.date,
        inLanguage: lang,
        keywords: article.tags ?? [],
        articleSection: article.topic[lang],
        image: articleImage,
        isPartOf: { '@id': `${home}#website` },
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
        isPartOf: { '@id': `${home}#website` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: publication.identity.name, item: home },
          { '@type': 'ListItem', position: 2, name: article.topic[lang], item: topicUrl },
          { '@type': 'ListItem', position: 3, name: article.title[lang], item: url },
        ],
      },
    ],
  };
}
