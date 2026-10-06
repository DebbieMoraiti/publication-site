# Security & Privacy Guidelines

This starter is designed for public artist websites. Treat every repository, CMS
field, image and integration as potentially public once a client site is launched.

## Security model

- Keep secrets out of the repository. Do not commit passwords, API keys, access
  tokens, private keys, recovery codes, service-account files or private notes.
- Use GitHub/Cloudflare/Formspree secret stores only when a future server-side
  integration genuinely requires a secret. The current static starter does not
  require repository secrets.
- Use a separate repository, Cloudflare project and optional Formspree project
  for each artist. Grant each app access only to that repository.
- Keep the default branch protected from accidental or unauthorized changes.
  Review production changes through a pull request when practical.

## Privacy by default

Do not publish private or unnecessary personal data. In particular, do not put
home addresses, personal phone numbers, private email addresses, dates of birth,
government/personal IDs, precise private locations, private travel plans,
recovery contacts or security answers in CMS content, config, Schema.org data,
press kits, image metadata or Git history.

The starter defaults to:

- no public email publication;
- no third-party media embeds;
- no contact form endpoint;
- no audio autoplay;
- no indexing while demo/client setup is incomplete;
- no Schema.org JSON-LD while the starter contains demonstration content;
- no Schema.org identity links unless individually marked as verified public.

Enable a public professional email only when it is intentionally published.
Prefer a dedicated booking/business address rather than a private mailbox.

## Public identities and anti-impersonation

Only add social profiles, MusicBrainz, Wikidata, Discogs or similar identifiers
when they are confirmed public identities for the artist. A profile used in
Schema.org `sameAs` must be verified by the site owner or through another
reliable public source before `verifiedPublic` is enabled.

Use the final official HTTPS domain in `seo.siteUrl`. Canonical URLs,
structured data and official social links should all point consistently to the
same public identity. Do not add private contact or operational details merely
to make Schema.org richer.

## CMS and links

Editorial URLs are validated before rendering. Only root-relative links or
HTTPS URLs without embedded credentials are accepted. Embeds are allowlisted to
privacy-enhanced YouTube and Vimeo player URLs; arbitrary iframes are not
created from CMS content.

Do not paste HTML, scripts, tracking snippets, shortened URLs or credentials
into content fields. Text content is rendered as text by Astro; do not replace
it with unreviewed `set:html` or `innerHTML`.

## Images and press assets

CMS uploads are limited to JPG/JPEG, PNG, WebP and AVIF. The build validates
image data and size, creates responsive variants and sanitizes deployed
`/uploads/` images so EXIF/GPS/device metadata is removed before publication.

Important: source uploads can still contain metadata in Git history. Before
committing sensitive photos to a repository that may become public, strip EXIF
metadata locally as well. Never publish photos that reveal a private home,
private location, badge/ID, access code, vehicle plate or other information
that creates a doxxing or physical-security risk.

## Forms

The form is disabled until explicitly configured. Use a client-owned Formspree
project, Restrict to Domain, spam protection and provider CAPTCHA/abuse controls
where appropriate. The form collects only name, email and message plus a
honeypot. Do not add sensitive fields unless there is a documented business
need. Review the provider's retention settings and delete submissions that are
no longer needed.

## Browser protections

Production builds generate a CSP and security headers. Third-party origins are
allowed only when the related feature is enabled. Do not weaken CSP to add an
unreviewed script, iframe, font CDN or analytics provider. Prefer self-hosted
static assets and HTTPS-only resources.

## Dependencies and deployment

Use `npm ci`, not `npm install`, in reproducible builds. Direct dependency
versions are pinned and `package-lock.json` must stay committed. Before
production changes run:

```sh
npm ci
npm run check
npm run build
npm audit --audit-level=moderate
```

Review unexpected dependency-tree changes before merging.

## GitHub and account controls

For each production repository:

- enable 2FA/passkeys on owner/editor accounts;
- restrict GitHub App installations to only required repositories;
- use a branch ruleset/protection policy for the production branch;
- require pull requests and successful build checks when the workflow allows;
- disable force-pushes and branch deletion on production;
- enable secret scanning and dependency/security alerts when available;
- periodically remove stale collaborators and third-party app access.

This file contains no credentials. Report suspected leaks by rotating/revoking
the affected credential first, then removing it from the current tree and Git
history as required.
