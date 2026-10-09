import type { APIRoute } from 'astro';
import { absoluteUrl, alternates, languagePath, type LanguageCode } from '../i18n/routes';
import { siteConfig } from '../config';
import { articles, authors, topics } from '../content/editorial';

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]!);

export const GET: APIRoute = () => {
  const publicArticles = articles.filter((article) => article.status === 'published');
  const usedAuthorSlugs = new Set(publicArticles.map((article) => article.author));
  const usedTopicSlugs = new Set(publicArticles.map((article) => article.topicSlug));
  const tags = [...new Set(publicArticles.flatMap((article) => article.tags ?? []))];

  const pages = [
    '',
    'archive',
    'contact',
    ...publicArticles.map((article) => `articles/${article.slug}`),
    ...authors.filter((author) => usedAuthorSlugs.has(author.slug)).map((author) => `authors/${author.slug}`),
    ...topics.filter((topic) => usedTopicSlugs.has(topic.slug)).map((topic) => `topics/${topic.slug}`),
    ...tags.map((tag) => `tags/${tag}`),
  ];

  const urls = pages.flatMap((page) => siteConfig.localization.languages.map((language) => {
    const loc = absoluteUrl(languagePath(language.code as LanguageCode, page));
    const links = alternates(page).map(({ lang, url }) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(url)}" />`,
    );
    links.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
        absoluteUrl(languagePath(siteConfig.localization.defaultLanguage as LanguageCode, page)),
      )}" />`,
    );
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${links.join('\n')}\n  </url>`;
  }));

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
