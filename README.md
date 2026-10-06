# Artist Website Starter

A clean Astro foundation for creating fast, static artist websites.

## Start here

For local work, install Node.js 22.12+ and run `npm ci`, `npm run check`,
`npm run build`, then `npm run preview`. Keep `seo.indexable: false` while the
site still contains sample content. Each real artist gets a separate repository
and a separate Cloudflare Worker; see the guides below before connecting a
domain or inviting an editor.

| Task | Guide |
| --- | --- |
| Install and verify locally | [Local setup](docs/SETUP.md) |
| Create an independent client site | [New client setup](docs/NEW-CLIENT.md) |
| Edit content and invite an editor | [Pages CMS](docs/CMS.md) |
| Attach a domain and launch indexing | [Domain and DNS](docs/DOMAIN-DNS.md) |
| Set up a client contact form | [Formspree](docs/FORMSPREE.md) |
| Recover content or a deployment | [Backup and rollback](docs/BACKUP-ROLLBACK.md) |
| Review demo removal and handoff | [Client checklist](CLIENT-CHECKLIST.md) |
| Security and privacy rules | [Security & privacy](SECURITY.md) |

## Current scope

The current foundation includes:

- a minimal Astro project structure;
- static HTML output;
- a shared base layout;
- global baseline styles;
- central site, theme, and module configuration;
- Pages CMS content forms for bilingual copy, cards, live events, and social links;
- responsive WebP/AVIF image variants, focal controls, and an image preview tool;
- a shared responsive header, navigation, modular content sections, and footer;
- an accessible mobile hamburger menu;
- neutral English and Greek routes, with a configurable default language;
- generated canonical, hreflang, Open Graph, optional Entity JSON-LD, sitemap, robots, and PNG share image;
- keyboard focus, skip-link, and reduced-motion support;
- Cloudflare Workers Static Assets deployment;
- automatic non-production preview versions;
- versioned deployments with rollback support.
- generated security headers and a build-specific Content Security Policy.

It does not include an artist-specific design, real content, a Formspree
endpoint, an audio file, analytics, or a custom domain.

## Requirements

- Node.js 22.12.0 or newer
- npm

## Local development

```sh
npm install
npm run dev
```

Astro will print the local development URL in the terminal.

## Production build

```sh
npm run build
npm run preview
```

The static production files are generated in `dist/`.

## Central configuration

Client settings and editable copy have separate sources:

- `src/content/artist.json`: artist identity, bilingual hero copy, public email,
  and social profiles, edited in Pages CMS.
- `src/config/site.json`: languages, time zone, contact form endpoint, privacy
  defaults, brand assets, SEO defaults, and optional website credit; not edited in Pages CMS.
- `theme.json`: colors, typography, spacing, radii, buttons, cards, and page
  backgrounds.
- `modules.json`: section visibility and order, menu behavior, optional detail
  pages, and feature toggles for bilingual content, CMS, audio, and contact.
- `index.ts`: combines artist content with technical settings for Astro and
  sorts enabled sections by their configured order.

## Modular sections

Each section has an `id`, translated menu labels, `enabled`, `order`, and
`showInMenu` in `src/config/modules.json`. The shared page renders only enabled
sections in ascending order. Section numbers, alternating backgrounds, and
navigation links follow the visible sections. The optional `pressKit` section
starts disabled. `hero` can also be disabled; an accessible page heading remains.

Neutral bilingual sample content lives in `src/content/`: `artist.json`, `about.json`,
`projects.json`, `discography.json`, `media.json`, `live.json`, `services.json`,
`contact.json`, and `press-kit.json`. A project, work, or service card uses translated `title`,
`subtitle`, `description`, and `imageAlt`, plus optional `image` and `url`.
Media items can have `title`, `embedUrl`, and `url`; live items use the fields
described below. Blank image, link, contact, and download
fields produce no public element. Empty item lists produce no empty cards.
Links accept HTTPS URLs or root-relative paths. Embeds accept HTTPS YouTube
video players (`/embed/VIDEO_ID`) and Vimeo players (`/video/ID`); use the
external link field for other websites.

Projects and Discography detail pages are not implemented; keep their
`detailPages` flags disabled. Disabling a parent section removes its homepage
section and menu entry. Replace all sample text with client-specific content
before enabling indexing.

## Live dates and archive

Add events in `src/content/live.json` with a unique lowercase `id`, an ISO date
(`YYYY-MM-DD`), translated `title`, and optional `venue`, `city`, `poster`,
translated `posterAlt`, and translated `ticketUrl` (`en` and `el`). Each
language can have a different ticket URL; an empty one produces no button.
Set `localization.timeZone` in `site.json` to the artist's IANA time zone.

Today's and future dates appear in ascending order on the homepage. Past dates
remain in the data and appear newest first in the archive. With the Live module
enabled, `detailPages.live: true` and `live.archiveEnabled: true` in
`modules.json`, the archive is available at `/live/` and at the other language's
equivalent route. Turning either flag off removes the archive pages and sitemap
entries. The page checks the date again in the visitor's browser on each load,
so events move to Past without a new deployment. Static HTML is classified at
build time; rebuild periodically if search crawlers must see the updated
Upcoming/Past grouping. When no events are listed, localized empty text appears.

The neutral home page intentionally reads the artist name, accent color, and
module order from these files. This provides a visible check that configuration
changes propagate without editing page markup.

## Language and search configuration

Edit `src/config/site.json` for each client:

- `localization.defaultLanguage` is `en` or `el`. That language occupies `/`;
  the other occupies `/en/` or `/el/`. Both versions share their sections and
  switching languages preserves the current section fragment.
- Set `seo.siteUrl` to the final HTTPS origin, without a path or trailing
  subdirectory. The same origin generates canonical links, hreflang links,
  Open Graph URLs, JSON-LD URLs, the sitemap, and the robots sitemap entry.
- Set `seo.titleSuffix` and `seo.description` separately for `en` and `el`.
  The artist name from `src/content/artist.json` is inserted automatically.
- Leave `seo.indexable` at `false` while the client site has placeholder
  content. Set it to `true` when the final site is ready for indexing.
- Leave `seo.shareImage` empty to generate `/social-share.png` from the artist
  name, default-language tagline, and theme colors. Set it to a root-relative
  PNG or JPEG path to use a supplied image instead. Keep a custom image at
  1200 × 630 pixels; the template assumes that size in Open Graph metadata.
- Configure `schema` as described below. The neutral starter has
  `schema.enabled: false`, so it emits no demonstration identity as JSON-LD.

## Entity Schema.org

`src/config/site.json` holds the reviewed Schema.org settings, separate from
the artist's CMS-edited copy in `src/content/artist.json`. The entity's
`name` and confirmed public social profiles come from that CMS content.
Set `schema.entityType` to `Person` or `MusicGroup`; its default `@id`
uses the configured HTTPS site origin plus `#person` or `#musicgroup`.
An explicit `schema.entityId` must use the same site origin. The website and
per-language page nodes link to that stable entity ID.

Optional reviewed fields in `site.json` include alternate name, bilingual
description, image, jobs/genres/location, founding details and members, and
external sources in `subjectOf`. Entries in `schema.sameAs` and a member's
`sameAs` require `{ "url": "https://…", "verifiedPublic": true }`; the CMS
social links have the same verification flag. Unverified or unsafe URLs are
omitted. Use `sameAs` only for the artist's own confirmed public identity;
use `subjectOf` for articles, interviews or coverage about the artist.
Empty fields produce no empty JSON-LD properties.

Enable `includeLiveEvents` to create MusicEvent nodes from the existing CMS
Live entries, only while the Live section is enabled. Optional
`schema.eventDetails` records can add a bilingual description, event URL,
end date and offer details using the same Live `id`; the event title, date,
venue, city, poster and language-specific ticket URL remain sourced from the
CMS. Upcoming events appear in home-page JSON-LD, and the archive page also
includes past events. `schema.discography` supports explicit, verified
MusicAlbum/MusicRecording records with a unique lowercase `id` and bilingual
name, only when the Discography section is enabled. Keep these records in sync
with the visible works; the current CMS cards do not have release type or
recording identifiers.

After replacing the neutral demo, setting the final `seo.siteUrl` and
verifying all identities, set `schema.enabled: true`. Check the English and
Greek JSON-LD in the generated HTML. The image-preview utility never emits
artist Schema. Enabling Schema does not enable search indexing; `seo.indexable`
remains a separate launch decision.

The `robots.txt` endpoint disallows crawling and pages output a `noindex` tag
until `seo.indexable` is enabled. The sitemap is still generated so it can be
checked before launch. The template domain is only for this neutral demo; replace
it and all sample identity text for each client.

## Responsive core

The site uses one shared responsive implementation for desktop, tablet, and
mobile. It does not create separate mobile pages.

- `/` renders the configured default language (English initially).
- `/el/` renders Greek initially; if Greek becomes default, English moves to `/en/`.
- `SiteHeader.astro` builds its navigation from enabled entries in
  `modules.json` and collapses to an accessible hamburger menu on small screens.
- `SiteFooter.astro` hides empty contact, social, and credit fields instead of
  rendering blank links.
- `DemoHome.astro` arranges the enabled section components for both languages.
- `ui.ts` contains shared interface labels; section content comes from the
  bilingual files in `src/content/`.

The current section bodies are neutral demonstrations. The contact form and
audio feature exist but remain disabled until configured for a client.

## Pages CMS content editing

The root `.pages.yml` exposes the artist name, bilingual hero copy, public
email, social profiles, About, Projects, Discography, Media, Live, Teaching &
Services, Contact, and optional Press Kit. Editors can leave optional text,
images, URLs, and lists empty. Cards with no translated title, media without a
valid link, and unused image/link elements are omitted from the public page.
Live entries require a unique lowercase ID, an ISO date, and titles in both
languages; duplicate IDs are also checked at build time.

The CMS has no form for `modules.json`, `theme.json`, SEO, languages, domain,
timezone, or contact form endpoint. Technical settings are stored in separate
files because a real CMS save removed empty values even with merge enabled.
Editors cannot delete the fixed content files through the CMS. Media uploads go to
`public/uploads/` and produce `/uploads/` URLs. A client site should have its
own repository, Pages CMS access, and invited collaborator account; do not
share the site owner's login. Invite collaborators from the corresponding
Pages CMS installation after its GitHub App is connected to that client repo.

For a client handoff, add one temporary entry in each list, save, inspect both
language routes and the preview deployment, then remove the entries and check
again. Check the production deployment separately after a reviewed merge. CMS
sign-in, collaborator permissions, and real saves must be verified with a
connected Pages CMS installation and the invited client's account; a local
Astro build cannot exercise that access flow.

## Images and framing

Pages CMS accepts JPG, PNG, WebP and AVIF images in `public/uploads/`, renaming
uploads to safe filenames. Keep each file under 12 MB and 40 megapixels. The
build checks the actual image data, corrects EXIF orientation and creates
responsive WebP and AVIF variants at widths up to the original size. It
generates `src/generated/images.json` and `public/_generated-images/` before
development and production builds. These outputs are ignored by Git; do not
upload them through CMS. The original uploads remain in the repository, and
invalid image data or an oversized upload fails the build while the last
successful production deployment stays available.

About and cards offer `imagePositionX`, `imagePositionY` (0–100, default 50)
and `imageZoom` (1–2, default 1). The optional image and translated alt text
are edited alongside them. Preview the framing at `/image-preview/`: select
a file on your own device, choose card or portrait, adjust the controls and
copy the three numbers into Pages CMS. The preview runs in the browser and
does not upload the selected file. Poster images are optimized too, but use
`contain` to keep the whole poster visible; no crop controls are needed.
Deployed upload files are sanitized during the production build so EXIF/GPS and
other image metadata are removed from the published copies. Source files in Git
may still retain metadata, so strip sensitive metadata before committing photos
to any repository that may become public. Only uploaded images with a generated
manifest entry render in these sections.
To use other image sources, first add them to the repository under
`public/uploads/` and select their `/uploads/` path. Empty fields produce no
image or broken placeholder. Each rendered image has intrinsic dimensions,
responsive `srcset`, lazy loading and async decoding.

## Optional contact form and audio intro

Both features start disabled in `src/config/modules.json` and have no client
endpoint or audio file in the starter. To set up a client:

1. Create a Formspree form for that client's project. Put its full HTTPS
   `https://formspree.io/f/FORM_ID` action URL in `site.json` under
   `contact.formEndpoint`, then enable `features.contactForm`. The Contact
   section must also be enabled. An empty endpoint keeps the form hidden.
2. In Formspree project Settings, use **Restrict to Domain** for the client's
   actual domain (without `https://`). Check both the final domain and any
   staging domain used for real submissions. Keep Formspree spam protection
   enabled. The form also sends a hidden `_gotcha` field. Domain restriction
   and delivery status are service settings, not controls the static website
   can enforce. Do not set a `no-referrer` or `same-origin` Referrer-Policy:
   Formspree uses the referrer for its domain restriction. Test delivery in
   the Formspree inbox and the client's email.
3. The form submits with JavaScript, disables the button while sending,
   preserves fields after a failed request and displays translated success,
   failure or rate-limit messages. Without JavaScript, it submits to Formspree
   as a standard HTML form. No real message can be tested in this starter
   until a client supplies an endpoint.
4. To add audio, place an MP3, OGG or WAV file under `public/audio/`, enter
   its root-relative `/audio/filename.mp3` path in `site.json` as `audio.src`,
   then enable `features.audioIntro`. The build fails if the enabled file is
   missing. The shared header gives visitors a play/stop button on every page.
   Manual playback is always available; `audio.autoplayOncePerTab` defaults
   to `false`. If enabled, it attempts autoplay at most once per browser tab,
   skips the attempt for reduced-motion preferences, and handles a browser
   refusal without claiming audio played. Browsers may block autoplay.

For handoff, use the client's own Formspree account and project. The public
form ID in `site.json` is not a login credential; never add API keys or
account credentials to this repository.

## Deployment

The project is connected to Cloudflare Workers Builds.

- Production branch: `main`
- Build command: `npm run build`
- Production deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler versions upload`
- Static assets directory: `dist/`
- Production URL: https://artist-website-starter.moraitidebbie.workers.dev/

Commits to non-production branches receive isolated preview versions and do not
replace the active production deployment. If a build fails, the previous
production version stays active. Cloudflare keeps version history so a previous
production version can be restored from the Deployments view.

## Security and quality checks

Run `npm run check`, `npm run build`, and `npm audit --audit-level=moderate`
before reviewing a change. The build generates `dist/_headers` for Cloudflare
Static Assets. Its Content Security Policy hashes the inline scripts in the
actual generated pages; adding a new inline script or changing page content
requires a new build. If the CSP exceeds Cloudflare's header length limit,
the build fails. The policy allows inline styles used by the theme, embeds on
the configured YouTube/Vimeo players, and Formspree connections and submissions.
The default `X-Robots-Tag: noindex` follows `seo.indexable: false`. Privacy
settings also keep public email and third-party embeds disabled until explicitly enabled.

Only HTTPS or root-relative links are rendered from content, and embeds are
limited to known player URLs. Public contact emails are validated before
creating `mailto:` links. Keep credentials and private addresses out of CMS
content and Git. Check the connected GitHub Apps' repository selection and
permissions, Cloudflare access, Pages CMS collaborators, and Formspree project
settings for each client at handoff. A build cannot verify those account
permissions or actual form delivery.

After a preview deploy, check both language routes and the live archive with
keyboard navigation, narrow and wide layouts, console/CSP errors, metadata,
links, and image descriptions. Repeat in current Chrome, Firefox, and Safari,
and run Lighthouse for performance, accessibility, best practices, and SEO on
the final client content and domain. Submit a real form message only after
the client supplies its Formspree endpoint. A failed CMS build leaves the last
successful deployment active; inspect the failed build and preview before
promoting another version.

## Project structure

```text
src/
├── components/
│   ├── DemoHome.astro
│   ├── SiteFooter.astro
│   ├── SiteHeader.astro
│   └── sections/
│       ├── SectionFrame.astro
│       └── ...
├── config/
│   ├── index.ts
│   ├── modules.json
│   ├── site.json
│   └── theme.json
├── content/
│   ├── about.json
│   ├── projects.json
│   └── ...
├── i18n/
│   ├── routes.ts
│   └── ui.ts
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── [lang]/
│   │   └── index.astro
│   ├── index.astro
│   ├── robots.txt.ts
│   ├── sitemap.xml.ts
│   ├── social-share.png.ts
│   └── [...path].astro
├── live/
│   └── events.ts
└── styles/
    └── global.css
package-lock.json
package.json
wrangler.jsonc
```
