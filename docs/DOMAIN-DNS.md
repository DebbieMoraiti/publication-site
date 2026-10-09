# Domain and launch

Storyfields is served from GitHub Pages at the final canonical domain, `https://storyfields.gr`. Public indexing is enabled in `src/config/site.json`; the generated robots file allows crawling and declares `https://storyfields.gr/sitemap.xml`.

## Before launch

1. Choose the final canonical hostname.
2. Set `seo.siteUrl` in `src/config/site.json` to the final HTTPS origin only.
3. If deploying through Cloudflare, rename/configure the Worker as needed and attach the custom domain.
4. Verify canonical URLs, hreflang, Open Graph, JSON-LD, RSS, sitemap and robots on the final domain.
5. Keep `seo.indexable: false` until all placeholder content, brand details and redirects are final.
6. When ready, set `seo.indexable: true`, rebuild and confirm global noindex metadata/headers and the robots disallow rule are gone. Draft previews must retain their page-level noindex.

If both apex and `www` are used, choose one canonical hostname and redirect the other explicitly.

The `/image-preview/` utility remains noindex. Draft previews and this utility are excluded from the sitemap. They remain crawlable so search engines can read their noindex directive.

For launch monitoring, verify ownership of `storyfields.gr` in Google Search Console and Bing Webmaster Tools, then submit `https://storyfields.gr/sitemap.xml`. Verification tokens must come from the property owner; do not invent them. Opening indexing and publishing a sitemap allow discovery but do not guarantee when a search engine will index the pages.
