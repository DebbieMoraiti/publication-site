# Client site checklist

Use one copy for each artist. Record the owner, repository, production URL,
preview URL, and date in your project notes; do not put private credentials here.
The site's technical setup is described in [the new client guide](docs/NEW-CLIENT.md).

## Ownership and foundation

- [ ] Create a **new repository from the template's default branch** for this client; do not include the template's other branches or use a fork.
- [ ] Decide who owns the GitHub repository, Cloudflare account/zone, domain, and optional Formspree project. Record how access is transferred or retained.
- [ ] Give the Worker a unique name in `wrangler.jsonc`; match that name in Cloudflare. Connect **this client's** repository and set `main` as its production branch.
- [ ] Review GitHub App repository selection and collaborator access separately for Cloudflare and Pages CMS. Do not share a login.
- [ ] Run `npm ci`, `npm run check`, `npm run build`, and `npm audit --audit-level=moderate` in the client copy.

## Remove the demonstration

- [ ] Replace `Artist Name`, the generic hero/biography, and every "Example project", "Example release", and "Example service" entry in `src/content/`. Remove any unused example cards rather than publishing them.
- [ ] Review both English and Greek text, including empty states and page metadata; no "Config-driven starter", "Replace this example", or other placeholder wording remains on either route.
- [ ] Set only a dedicated public professional contact address and confirmed public social URLs in Pages CMS, or leave those fields empty. Keep public-email publication disabled unless intentionally needed. Mark Schema.org identities verified only after checking them. Never publish private email addresses, phone numbers, home addresses, IDs, access tokens, passwords, private locations, or travel plans.
- [ ] Add real photos/posters under `public/uploads/`; provide meaningful alt text, check cropping at `/image-preview/`, and remove demonstration or unused uploads. Check sensitive photos for EXIF/GPS and visible doxxing clues before committing them; production copies are sanitized but Git history can retain originals.
- [ ] Decide which sections are needed, their order, and menu entries in `src/config/modules.json`. Disable the press kit and other unused sections; verify both navigation and archive links.
- [ ] Choose typography, colors, spacing, and backgrounds in `src/config/theme.json`; check contrast and narrow/mobile layouts with real content.
- [ ] Review `src/config/site.json`: default language, artist time zone, privacy flags, SEO title/description, Schema entity type, share image, branding, and optional website credit. Verify public identities and source URLs before enabling `schema.enabled`; review both language graphs and omit unverified events/works. Keep public email and third-party embeds disabled unless intentionally required. Keep `seo.indexable: false` until launch.
- [ ] Search the client repository for sample strings and the template domain. Any remaining template domain must be an intentional reference in documentation, never the client's canonical URL.

## Services and preview

- [ ] Invite only this client's editor to the correct Pages CMS repository; test a content and image save with that account and inspect the resulting Git commit and preview.
- [ ] If a contact form is wanted, create a client-owned Formspree project, configure and test delivery as in [the Formspree guide](docs/FORMSPREE.md). Otherwise keep `features.contactForm: false` and the endpoint blank.
- [ ] If audio is wanted, add the real file under `public/audio/`, enable `features.audioIntro`, test the play/stop control, and keep autoplay off unless specifically agreed.
- [ ] Check preview build status, both languages, live archive, keyboard navigation, skip link, images, links, browser console, and the generated `dist/_headers`.
- [ ] Check current Chrome, Firefox, and Safari, then run Lighthouse on the actual client content. Recheck after a CMS edit; the neutral starter result is not a client launch result.
- [ ] Test a deliberately invalid edit on an isolated branch if build-failure recovery is part of handoff. Confirm the active production deployment stays available; then remove the test branch.

## Domain, launch, and handoff

- [ ] Attach the client hostname to the client's Worker. Decide the canonical `www` or apex hostname and configure the other hostname's redirect separately if both are used.
- [ ] Set `seo.siteUrl` to the final HTTPS origin, then verify canonical/hreflang, Open Graph, sitemap, robots, share image, HTTPS, redirects, and security headers on the live domain.
- [ ] Set `seo.indexable: true` only after all sample content is gone and the live domain is correct. Rebuild and confirm the `noindex` meta/header and robots disallow rule are removed.
- [ ] Review access to GitHub, Cloudflare, Pages CMS, domain/DNS, and Formspree; restrict GitHub Apps to this repository, remove stale collaborators, and record renewal/recovery contacts outside the repository. Confirm 2FA/passkeys, secret/dependency alerts, and production-branch ruleset/protection.
- [ ] Make a Git backup, record the current Cloudflare deployment/version, and explain the separate code revert and deployment rollback paths.
- [ ] Give the client their live URL, content editing instructions, form destination if used, support contact, and a short save-and-preview demonstration. Confirm signoff.

Use [backup and rollback](docs/BACKUP-ROLLBACK.md) when a saved edit or deployment needs recovery.
