import type { APIRoute } from 'astro';
import { renderRss } from '../../lib/rss';
import { secondaryLanguages, type LanguageCode } from '../../i18n/routes';

export function getStaticPaths() {
  return secondaryLanguages.map(({ code }) => ({ params: { lang: code } }));
}

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang as LanguageCode;
  return new Response(renderRss(lang), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
