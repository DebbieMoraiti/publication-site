# Publication Site

Independent bilingual editorial publication built with Astro.

Live preview: https://debbiemoraiti.github.io/publication-site/

## Current scope

The project includes:

- static Astro output;
- English and Greek routes;
- editorial homepage, articles, archive, authors, topics and tags;
- draft/published article states;
- RSS, sitemap, robots, canonical and hreflang;
- publication/article/breadcrumb structured data;
- Pages CMS collections for articles, authors, topics and publication identity;
- responsive image preprocessing and upload sanitization;
- generated security headers and CSP;
- keyboard focus, skip link and reduced-motion support;
- GitHub Pages preview deployment;
- optional Cloudflare static-assets deployment configuration.

## Local development

Requires Node.js 22.19 or newer.

```sh
npm ci
npm run check
npm run build
npm run dev
```

Do not edit `dist/`, `public/_generated-images/` or `src/generated/images.json` directly.

## Content

Editorial content lives in:

- `src/content/publication.json`
- `src/content/articles/*.json`
- `src/content/authors/*.json`
- `src/content/topics/*.json`

The repository validates slugs, dates, author/topic references, article status and the single-featured-story rule during build.

## Configuration

- `src/config/site.json`: languages, timezone, SEO, branding, privacy and website credit.
- `src/config/theme.json`: colors, typography, spacing and radii.
- `.pages.yml`: Pages CMS editing model.
- `wrangler.jsonc`: optional Cloudflare static-assets deployment.
- `.github/workflows/publication-preview.yml`: GitHub Pages preview build/deploy.

Keep `seo.indexable` set to `false` until the final brand, domain and launch content are ready.

## Documentation

- [CMS workflow](docs/CMS.md)
- [Local setup](docs/SETUP.md)
- [Domain and launch](docs/DOMAIN-DNS.md)
- [Backup and rollback](docs/BACKUP-ROLLBACK.md)
- [Security and privacy](SECURITY.md)
