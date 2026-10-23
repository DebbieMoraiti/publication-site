# Security & Privacy Guidelines

This repository builds a public editorial website. Treat committed content, images and configuration as potentially public.

## Repository and account security

- Keep passwords, API keys, access tokens, recovery codes and private notes out of Git.
- Use 2FA/passkeys on GitHub and deployment accounts.
- Restrict connected apps to only the repositories they need.
- Review production changes and build status before launch.
- Enable secret scanning and dependency/security alerts when available.

## Privacy

Do not publish unnecessary personal information in articles, author records, metadata, structured data, images or Git history.

Before committing sensitive photos, remove EXIF/GPS metadata locally. Production uploads are sanitized during the build, but the original source file can remain in Git history.

## Content safety

Editorial text is rendered as data rather than arbitrary HTML. Do not add unreviewed `set:html`, inline third-party scripts, tracking snippets or arbitrary iframes.

External links and future integrations should use HTTPS and be reviewed before publication.

## Browser protections

Production builds generate security headers and a build-specific Content Security Policy. An early meta CSP applies supported directives on GitHub Pages, which ignores `_headers`. HTTP-only protections (including frame-ancestors, HSTS and Permissions-Policy) remain inactive there unless applied by a supporting host or edge. Third-party frames are disabled by default. Do not weaken the CSP merely to make an unreviewed integration work.

Contact uses an AJAX POST to the configured HTTPS form endpoint, with JSON responses, no cookies/referrer and no redirects. CSP `connect-src` permits this exact provider origin alongside the site itself and the Cloudflare Analytics collection endpoint; `form-action` preserves the configured form provider for the no-JavaScript fallback. The success dialog opens only after confirmation from the service; failed/ambiguous requests keep the text for retry.

The reviewed third-party analytics script is restricted to `https://static.cloudflareinsights.com/beacon.min.js` and sends measurements to `https://cloudflareinsights.com/cdn-cgi/rum`. The local loader restricts activation to the production HTTPS hosts; non-public pages omit it. Cloudflare does not offer safe version pinning/SRI for the manually embedded beacon, so do not add a stale integrity hash. No cookies or browser storage are introduced by our loader. Keep the bilingual visitor notice current when integrations change.

## Images

Uploads are limited to JPG/JPEG, PNG, WebP and AVIF. The build validates image data and size, creates responsive variants and sanitizes deployed uploads.

## Dependencies

Use reproducible installs:

```sh
npm ci
npm run check
npm run build
npm audit --audit-level=moderate
```

Review unexpected dependency-tree changes before merging.

## Indexing

Keep `seo.indexable: false` while the publication contains placeholder content or uses a temporary identity/domain. Enable indexing only after the final public configuration has been reviewed.
