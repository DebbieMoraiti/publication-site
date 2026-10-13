# Storyfields

**An independent bilingual editorial publication — designed and developed by Debbie Moraiti.**

[Live website](https://storyfields.gr/) · [Portfolio case study](https://github.com/DebbieMoraiti/DebbieMoraiti/blob/main/case-studies/storyfields.md) · [GitHub profile](https://github.com/DebbieMoraiti)

<img src="https://raw.githubusercontent.com/DebbieMoraiti/DebbieMoraiti/main/case-studies/assets/storyfields-homepage-hero.png" alt="Storyfields published homepage with the editorial masthead and featured story" width="680">

*Screenshot from the published site. [Open Storyfields](https://storyfields.gr/).*

## About the project

Storyfields publishes stories about people, music, creativity and everyday life. The website combines a newspaper-inspired visual identity—paper-toned backgrounds, serif typography, fine rules and a structured editorial grid—with a modern, responsive reading experience.

This is a live project with **English and Greek** content, an editorial publishing workflow and ongoing maintenance. It demonstrates both visual design and the less visible engineering required to keep a content-rich site usable and maintainable.

**Role:** website design and development, front-end implementation, content architecture, publishing workflow, technical SEO and maintenance.

## Features

- **Bilingual architecture:** English and Greek routes with localized navigation, article content and metadata, supported by shared Astro components.
- **Editorial content model:** articles, authors, topics and tags; draft/published states, a featured story, archives, related articles and reading-time metadata.
- **Content editing:** Pages CMS works with structured JSON content, while build-time checks validate slugs, dates, references and publishing rules.
- **Discoverability:** canonical URLs, `hreflang`, structured data, RSS feeds, XML sitemaps and social sharing metadata.
- **Responsive and accessible UI:** newspaper-style layouts across screen sizes, processed responsive images, semantic markup, keyboard navigation, visible focus and reduced-motion support.
- **Security-aware implementation:** generated Content Security Policy, protected form submission, image validation and privacy-conscious analytics integration.
- **Automated workflow:** GitHub Actions builds, deployment configuration and post-build/deployed-site audits.

## Technology

| Area | Implementation |
| --- | --- |
| Front end | Astro, TypeScript / JavaScript, CSS |
| Image processing | Sharp and build-time responsive image generation |
| Content management | Pages CMS, JSON content collections |
| Builds & deployment | Node.js, npm, GitHub Actions, GitHub Pages preview; optional Cloudflare static-assets configuration |
| Forms & analytics | Formspree, Cloudflare Web Analytics |

The site uses **static page generation** rather than a custom application server. Editorial content is kept separate from visual configuration and reusable page components.

## Technical decisions

**Keep the two languages consistent.** Articles store localized content in a shared editorial model; route helpers and shared components avoid separate implementations for each language.

**Separate publishing from technical configuration.** Editors can update articles and other editorial content through Pages CMS, while deployment, security policy, SEO settings and design tokens remain in version-controlled configuration.

**Treat publishing quality as part of development.** Build-time validation, image preprocessing, metadata generation and deployment audits help catch issues before or after publication.

**Plan for accessibility and privacy.** Responsive layouts, keyboard support, restrictive browser policies and deliberate loading of third-party integrations are considered as part of the implementation.

## Explore the implementation

- [Editorial content model](src/content/editorial.ts)
- [Homepage component](src/components/PublicationHome.astro) and [article template](src/components/ArticlePage.astro)
- [Pages CMS configuration](.pages.yml)
- [Site settings](src/config/site.json) and [design tokens](src/config/theme.json)
- [Build and deployment workflow](.github/workflows/publication-preview.yml)
- [Portfolio case study with more screenshots](https://github.com/DebbieMoraiti/DebbieMoraiti/blob/main/case-studies/storyfields.md)

The sections below contain the practical setup, publishing, indexing, security and maintenance notes for working with this repository.

---

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
