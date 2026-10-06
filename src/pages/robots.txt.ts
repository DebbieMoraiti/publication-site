import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import { absoluteUrl } from '../i18n/routes';

export const GET: APIRoute = () => new Response(
  `User-agent: *\n${siteConfig.seo.indexable ? 'Allow: /' : 'Disallow: /'}\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
