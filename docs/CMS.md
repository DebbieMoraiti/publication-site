# Editing with Pages CMS

Pages CMS edits files in the GitHub repository. This starter's `.pages.yml`
exposes the fixed JSON content files under `src/content/` and media uploads in
`public/uploads/`. It does **not** expose technical settings such as domain,
language, SEO, theme, section order, or Formspree endpoint. A save creates a
Git commit; the connected Cloudflare build then runs for that branch.

## Connect the correct repository

1. Go to [Pages CMS](https://app.pagescms.org/) and sign in with GitHub. Install
   or update its GitHub App for the **individual client's repository**. Check
   the selected repository in the GitHub App installation; do not grant access
   to unrelated client repositories.
2. Open the client's repository and choose the intended branch. Pages CMS
   reads `.pages.yml` from that branch. `main` is production in this setup;
   use a client branch and its preview for a review cycle when appropriate.
3. For an editor who has no GitHub account, invite a Pages CMS collaborator
   by their own email to that repository, then test their sign-in and a real
   content save. A collaborator can edit content and media in the configured
   repository, but cannot manage `.pages.yml` or other collaborators. Never
   give them the site owner's password. Confirm the actual permissions with
   the invited account before handoff.

## Edit and preview

- Edit the artist name and hero text in **Artist & social links**. Text has
  separate `en` and `el` fields. Leave optional contact/social fields blank
  when unavailable; public email must be a dedicated public professional address and social
  links must use HTTPS. The email still remains hidden unless publication is
  explicitly enabled in the technical privacy config. Mark a social profile
  `verifiedPublic` only after confirming it is an official public identity.
- About, Projects, Discography, Media, Live, Services, Contact and optional
  Press Kit are separate entries. A card needs a title in each language.
  Blank optional image/link fields render no broken placeholders. To remove a
  sample card, delete its item in the list and save.
- Upload JPG, PNG, WebP or AVIF under 12 MB and 40 megapixels. Add `imageAlt`
  or `posterAlt` descriptions in both languages. For card and portrait crops,
  use `/image-preview/` to choose X/Y focus (0–100) and zoom (1–2); copy the
  values into the CMS fields. A bad or oversized image fails the build. The
  deployed upload copy is metadata-sanitized, but source uploads may still carry
  EXIF/GPS data in Git history; strip sensitive metadata before committing images.
- For an event, use a **unique** lowercase ID with letters, digits or hyphens,
  `YYYY-MM-DD` date, and titles in both languages. The time zone is in
  `src/config/site.json`. Past dates go to the archive, provided the Live
  section and archive flags are enabled. Ticket URLs can differ by language.
- Media embeds are disabled by default for privacy. When explicitly enabled,
  they accept a YouTube `/embed/VIDEO_ID` or Vimeo
  `player.vimeo.com/video/ID` HTTPS player URL. For other sources, use the
  external HTTPS link field. Do not paste a regular YouTube watch URL into
  `embedUrl`.
- Save, inspect the commit and Cloudflare build, then open both language
  routes on that branch's preview. Check the image, link, and section you
  changed. If a build fails, correct the content and save again; see
  [backup and rollback](BACKUP-ROLLBACK.md).

Section visibility and order belong in `src/config/modules.json` and require a
code review/deploy. A hidden Press Kit is still editable in CMS but does not
appear on the public site until its section is enabled.

Pages CMS's [quick start](https://pagescms.org/docs/quick-start/) and
[collaborator guide](https://pagescms.org/docs/configuration/collaborators/)
describe its current access flow. This repository's `.pages.yml` is the source
of truth for the fields actually available here.
