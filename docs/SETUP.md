# Local setup and verification

This repository builds a static Astro publication into `dist/`.

## Requirements

- Node.js 22.19 or newer
- npm

## Verify locally

```sh
npm ci
npm run check
npm run build
npm run preview
```

For active development:

```sh
npm run dev
```

The image preprocessing step runs automatically before check/build/dev. It validates uploads, creates responsive AVIF/WebP variants and writes `src/generated/images.json`.

Do not edit generated output in `dist/`, `public/_generated-images/` or `src/generated/images.json`.

## Main sources

| Purpose | Source |
| --- | --- |
| Publication identity and intro | `src/content/publication.json` |
| Articles | `src/content/articles/*.json` |
| Authors | `src/content/authors/*.json` |
| Topics | `src/content/topics/*.json` |
| SEO, languages, privacy, credit | `src/config/site.json` |
| Colors, typography, spacing | `src/config/theme.json` |
| CMS model | `.pages.yml` |
| GitHub Pages preview | `.github/workflows/publication-preview.yml` |
| Optional Cloudflare deployment | `wrangler.jsonc` |

Keep indexing disabled while the site contains placeholder content.
