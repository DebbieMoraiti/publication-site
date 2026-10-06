# Domain and launch

The current preview is served from GitHub Pages. A final custom domain can be connected later.

## Before launch

1. Choose the final canonical hostname.
2. Set `seo.siteUrl` in `src/config/site.json` to the final HTTPS origin only.
3. If deploying through Cloudflare, rename/configure the Worker as needed and attach the custom domain.
4. Verify canonical URLs, hreflang, Open Graph, JSON-LD, RSS, sitemap and robots on the final domain.
5. Keep `seo.indexable: false` until all placeholder content, brand details and redirects are final.
6. When ready, set `seo.indexable: true`, rebuild and confirm the noindex meta/header and robots disallow rule are gone.

If both apex and `www` are used, choose one canonical hostname and redirect the other explicitly.

The `/image-preview/` utility should remain noindex.
