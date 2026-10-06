import { articles } from '../content/editorial';
import publication from '../content/publication.json';
import { absoluteUrl, languagePath, type LanguageCode } from '../i18n/routes';

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]!);

export function renderRss(lang: LanguageCode) {
  const published = articles
    .filter((article) => article.status === 'published')
    .sort((a, b) => b.date.localeCompare(a.date));

  const items = published.map((article) => {
    const url = absoluteUrl(languagePath(lang, `articles/${article.slug}`));
    return [
      '  <item>',
      `    <title>${escapeXml(article.title[lang])}</title>`,
      `    <link>${escapeXml(url)}</link>`,
      `    <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `    <description>${escapeXml(article.dek[lang])}</description>`,
      `    <pubDate>${new Date(`${article.date}T12:00:00Z`).toUTCString()}</pubDate>`,
      '  </item>',
    ].join('\n');
  });

  const home = absoluteUrl(languagePath(lang));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `  <title>${escapeXml(publication.identity.name)}</title>`,
    `  <link>${escapeXml(home)}</link>`,
    `  <description>${escapeXml(publication.identity.tagline[lang])}</description>`,
    `  <language>${lang === 'el' ? 'el-GR' : 'en'}</language>`,
    ...items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}
