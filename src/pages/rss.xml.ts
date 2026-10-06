import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import { renderRss } from '../lib/rss';
import type { LanguageCode } from '../i18n/routes';

export const GET: APIRoute = () => {
  const lang = siteConfig.localization.defaultLanguage as LanguageCode;
  return new Response(renderRss(lang), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
