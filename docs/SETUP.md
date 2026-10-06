# Local setup and verification

This repository produces a static Astro site in `dist/`. It needs Node.js
22.12 or newer and npm. Work in the repository for the relevant artist.

```sh
npm ci
npm run check
npm run build
npm run preview
```

The preview command prints a local URL. For content work, `npm run dev` starts
Astro and first regenerates uploaded image variants. `npm run build` runs that
same image step, builds five default HTML pages plus sitemap/robots/share image,
and writes `dist/_headers` for the Cloudflare static assets deployment. A
different module configuration may change the page count. Do not edit
`dist/`, `public/_generated-images/`, or `src/generated/images.json`; rebuild
them from the source files.

Run `npm audit --audit-level=moderate` when reviewing dependency changes.
Do not commit `.env` files or service tokens. Formspree's public form endpoint
is a URL, not an account credential.

| Change | Source file |
| --- | --- |
| Artist name, copy, public email, social links, events, cards | `src/content/*.json` (also editable through Pages CMS) |
| Language, time zone, canonical domain, SEO, optional form/audio | `src/config/site.json` |
| Visible sections, order, menu, optional features | `src/config/modules.json` |
| Colors, typography, spacing | `src/config/theme.json` |
| Pages CMS editing fields | `.pages.yml` |
| Cloudflare Worker name, static assets | `wrangler.jsonc` |

See [new client setup](NEW-CLIENT.md) before deploying a copy. The template
Worker name and domain belong only to the starter, not to a new client.

## Build failure

Read the first actionable error in the Astro or image build log. Common causes
are duplicate live event IDs, an invalid image or oversized upload, a missing
enabled audio file, malformed form endpoint, invalid language/domain settings,
or an inline-script CSP line exceeding Cloudflare's limit. Fix the source
file, rerun `npm run check` and `npm run build`, then push a reviewed commit.
See [backup and rollback](BACKUP-ROLLBACK.md) for a bad production deployment.
