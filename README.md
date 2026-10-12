# Publication Site

Independent bilingual editorial publication built with Astro.

Live publication: https://storyfields.gr/

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

Public indexing is enabled with `seo.indexable: true`. Published pages allow crawling and appear in the bilingual sitemap. Draft article previews and `/image-preview/` retain page-level `noindex` and are excluded from the sitemap, feeds and public listings. Empty topic/author archives also remain `noindex` until they have published stories. Setting `seo.indexable` to `false` blocks crawling and adds global `noindex` again.

## Contact delivery

Contact is available at `/contact/` and `/el/contact/`. Delivery settings live in `src/config/site.json` under `contact`. The approved Formspree endpoint is `https://formspree.io/f/xjygwnwe`, with `_gotcha` as its honeypot field.

The Astro/static site uses a native HTML form with `method="post"` and the configured endpoint as its `action`. Name, email, subject and message are submitted only when the visitor sends the form; Formspree handles delivery and the response page. The form works without JavaScript and needs no React, SDK or external script. The destination inbox and any provider credentials are configured in Formspree, never in the repository or browser code.

An approved **public editorial email address** can optionally be set in `contact.email` to display a direct email link. If the endpoint is removed, the form instead opens a draft in the visitor’s email app; the visitor sends it from there. With neither delivery option configured, entry and submission are disabled. The build rejects credentials and query parameters in endpoint URLs.

The form uses native required/email validation and length limits. Its hidden `_gotcha` field is supported by Formspree’s server-side honeypot protection. The generated CSP allows form submissions only to the configured endpoint origin (`https://formspree.io`); without an endpoint, `form-action` is `none`. AJAX delivery uses no cookies or referrer and shows the existing success dialog after provider confirmation.

## Web Analytics

Cloudflare Web Analytics is loaded by `public/scripts/web-analytics.js` only on HTTPS `storyfields.gr` and `www.storyfields.gr`. Local development, preview hosts and noindex pages are excluded. The public beacon token is not an account credential. No additional analytics service or custom click tracking is installed.

Visitor information is available at `/privacy/` and `/el/privacy/`, linked from the footer. Cloudflare documents its beacon as using no cookies or browser storage. This describes the analytics integration, not a blanket legal exemption for future integrations.

The postbuild script emits both `_headers` for compatible hosts and an early meta CSP for GitHub Pages, which does not apply `_headers`. The script source and collection endpoint are explicitly allowed without script wildcards or `unsafe-inline`. HTTP-only protections such as `frame-ancestors`, HSTS and Permissions-Policy require a host or edge that supports response headers; the meta CSP cannot replace these.

Run `node scripts/audit-analytics.mjs` after building. It checks every HTML page's effective policy, script hashes, noindex exclusions, production host guards and duplicate prevention. View collected measurements in Cloudflare → Web Analytics → storyfields.gr. Ad blockers and browsers that block the beacon will reduce measured traffic.

## Documentation

- [CMS workflow](docs/CMS.md)
- [Local setup](docs/SETUP.md)
- [Domain and launch](docs/DOMAIN-DNS.md)
- [Backup and rollback](docs/BACKUP-ROLLBACK.md)
- [Security and privacy](SECURITY.md)
