# Publication Site

Independent bilingual editorial publication built with Astro.

Live preview: https://debbiemoraiti.github.io/publication-site/

## Current scope

The project includes:

- static Astro output;
- English and Greek routes;
- editorial homepage, articles, archive, authors, topics, tags and Contact;
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

## Contact delivery

Contact is available at `/contact/` and `/el/contact/`. Delivery settings live in `src/config/site.json` under `contact`; they intentionally start empty, so the page explains that contact is not yet available and disables message entry and submission.

To activate email delivery, set `contact.email` to an approved **public editorial email address** and rebuild/deploy. The form then opens a draft in the visitor’s email app, with the subject and message filled in. The visitor sends it from their email app. The direct email link also works without JavaScript. This mode does not provide server-side form delivery.

To activate direct form delivery, create or supply an approved **public HTTPS POST form endpoint**, configure its destination inbox at the provider, and set `contact.formEndpoint` to that URL. It must accept `name`, `email`, `subject` and `message` and return its own accessible success/error page. No account or endpoint has been created for this repository. Credentials, API keys, private recipient addresses and other secrets belong on the provider/server, never in this config or browser code. The build rejects credentials and query parameters in the endpoint URL. An optional public `contact.email` remains the direct fallback when a form endpoint is configured.

The form uses native required/email validation and length limits. `contact.honeypotField` defaults to `website`; set it to the provider’s supported honeypot field name and enable its server-side spam protection and rate limiting. The browser honeypot alone is not a spam filter. The generated CSP allows form submissions only to the configured endpoint origin; without an endpoint, `form-action` is `none`. No third-party scripts, embeds, analytics, browser storage or background form requests are used.

## Documentation

- [CMS workflow](docs/CMS.md)
- [Local setup](docs/SETUP.md)
- [Domain and launch](docs/DOMAIN-DNS.md)
- [Backup and rollback](docs/BACKUP-ROLLBACK.md)
- [Security and privacy](SECURITY.md)
