# Storyfields favicon

The favicon uses the approved overlapping serif **SF** monogram inside an open-book outline, with near-black ink and warm ivory pages. The artwork was created and approved in the Storyfields conversation on 12 October 2026 (Europe/Athens).

These files are exports of that approved artwork, with no redrawing or changes to the letters or book:

| File | Purpose |
| --- | --- |
| `public/brand/storyfields-favicon.png` | 512 × 512 transparent PNG for reuse |
| `public/brand/storyfields-favicon-32.png` | 32 × 32 transparent browser icon |
| `public/favicon.ico` | Browser fallback containing 16, 32 and 48 px PNG frames |
| `public/apple-touch-icon.png` | 180 × 180 home-screen icon on the ivory background |

`src/config/site.json` points `branding.favicon` to the 32 px PNG. `src/layouts/BaseLayout.astro` links the PNG, ICO and Apple icon in the shared page head, so the same favicon is available throughout the English and Greek site. All links use the existing `assetPath` helper to support a configured base path.

The existing site wordmark, page layout, topic photographs and article images are separate assets and are unchanged by this favicon addition.
