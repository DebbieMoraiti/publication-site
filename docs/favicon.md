# Storyfields favicon

The favicon uses separate serif **S** and **F** letters inside the approved open-book outline, with near-black ink and warm ivory pages. The artwork was created in the Storyfields conversation on 12 October 2026 (Europe/Athens), then revised at the owner's request so the letters have a visible gap and no longer touch or overlap.

These files are size and format exports of that revised artwork, preserving the book frame, serif lettering and colors:

| File | Purpose |
| --- | --- |
| `public/brand/storyfields-favicon.png` | 512 × 512 transparent PNG for reuse |
| `public/brand/storyfields-favicon-32.png` | 32 × 32 transparent browser icon |
| `public/favicon.ico` | Browser fallback containing 16, 32 and 48 px PNG frames |
| `public/apple-touch-icon.png` | 180 × 180 home-screen icon on the ivory background |

`src/config/site.json` points `branding.favicon` to the 32 px PNG. `src/layouts/BaseLayout.astro` links the PNG, ICO and Apple icon in the shared page head, so the same favicon is available throughout the English and Greek site. All links use the existing `assetPath` helper to support a configured base path. The icon URLs use `?v=2` so browsers request the revised artwork instead of the previously cached version.

The existing site wordmark, page layout, topic photographs and article images are separate assets and are unchanged by this favicon addition.
