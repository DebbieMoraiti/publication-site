import type { APIRoute } from 'astro';
import { articles } from '../content/editorial';
import publication from '../content/publication.json';
import { absoluteUrl, languagePath } from '../i18n/routes';
import { siteConfig } from '../config';

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]!);

export const GET: APIRoute = () => {
  const lang = siteConfig.localization.defaultLanguage as 'en' | 'el';
  const published = articles
    .filter((article) => article.status === 'published')
    .sort((a, b) => b.date.localeCompare(a.date));

  const items = published.map((article) => {
    const url = absoluteUrl(languagePath(lang, `articles/${article.slug}`));
    return [
      '  <item>',
      `    <title>${escapeXml(article.title[lang])}</title>`,
      `    <link>${escapeXml(url)}</link>`,
      `    <guid>${escapeXml(url)}</guid>`,
      `    <description>${escapeXml(article.dek[lang])}</description>`,
      `    <pubDate>${new Date(`${article.date}T12:00:00Z`).toUTCString()}</pubDate>`,
      '  </item>',
    ].join('\n');
  });

  const home = absoluteUrl(languagePath(lang));
  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '<channel>',
      `  <title>${escapeXml(publication.identity.name)}</title>`,
      `  <link>${escapeXml(home)}</link>`,
      `  <description>${escapeXml(publication.identity.tagline[lang])}</description>`,
      `  <language>${lang}</language>`,
      ...items,
      '</channel>',
      '</rss>',
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
  );
};
