# Website security and privacy review — 12 October 2026

Scope: passive HTTP/HTML inspection of Storyfields, Stelios Sioulas and The Prisoners, plus review of the current repository sources. No messages were submitted, credentials were inspected or exploit attempts were performed. Account permissions, DNS administration, provider-side spam settings and actual third-party browser cookies were not verified. This is a focused review, not a complete penetration test.

## Findings

| Site | Verified observation | Action |
| --- | --- | --- |
| Storyfields | HTTPS works and HTTP redirects to HTTPS. The live GitHub Pages response has no CSP or custom security headers, and the source only generated `_headers`. | This change adds an early meta CSP and referrer policy to every generated HTML document. Google ownership verification remains byte-for-byte unchanged. |
| Storyfields | The manual Cloudflare beacon needs an explicit script permission and collection endpoint permission. | Allow only the beacon script path and collection endpoint; preserve hashed inline scripts, disabled inline handlers and disabled third-party frames. |
| Storyfields | Wrangler 4.136.2 brought four high-severity dependency findings through development dependencies. | Update only Wrangler to 4.149.0 and its lockfile dependencies. `npm audit --audit-level=moderate` now reports zero known vulnerabilities. The deployed site is static and does not run Wrangler or Miniflare. |
| Storyfields | The latest article edit referenced `sotiris-fragkos`, absent from the author catalog, and blocked production builds. | Add a minimal author entry named “Sotiris Fragkos”, preserving the selected byline; no biography or external affiliation is inferred. |
| Stelios Sioulas | `http://steliossioulas.gr/` returned HTTP 200 without upgrading to HTTPS. HTTPS itself works. | Enable **Enforce HTTPS** in this repository's GitHub Pages settings and verify all HTTP routes redirect. This setting has not been changed by this review. |
| Stelios Sioulas | Live homepage HTML includes Instagram, TikTok, standard YouTube and youtube-nocookie frames. CMS JavaScript also creates frames. | Add a user-controlled load step for third-party players and review their privacy disclosure. `loading="lazy"` is not a consent control, and youtube-nocookie alone does not cover other providers. No claim of cookie-free operation can be made from source inspection. |
| Stelios Sioulas | CMS text uses `textContent` and DOM creation; reviewed link helpers reject non-HTTPS protocols. Temporary language/scroll preferences use sessionStorage. | Preserve these controls. Add a tailored CSP after inventorying permitted media, frames and form endpoints. |
| The Prisoners | The old github.io URL resolves to `https://uptheprisoners.gr/`; the custom domain's HTTP URL upgrades to HTTPS. | Keep these redirects. |
| The Prisoners | No analytics beacon or iframe was present in the inspected homepage. sessionStorage remembers the intro and event popup. | These are temporary functional preferences, not proof that all possible storage is absent. No analytics token for this site has been supplied or installed. |
| The Prisoners | Contact uses a Formspree POST and checks HTTP success. It has no explicit timeout, referrer suppression or redirect rejection in the inspected handler. | Bring its request handling in line with Storyfields before describing all sites as equally protected. No real submission was made. |
| All three | Inspected live responses did not contain CSP, HSTS or frame-blocking headers. | GitHub Pages does not apply the repository's `_headers` file. Meta CSP covers only supported content directives; HTTP-only protections require a supporting host or edge. Do not change DNS merely to install Analytics. |

## Storyfields implementation

- Production HTTPS host guard prevents local and preview traffic from loading the beacon.
- Non-public/noindex pages omit the loader; duplicate beacons are prevented.
- Analytics does not read or transmit contact field contents in our code.
- The public token is a site identifier; it is not a Cloudflare account credential.
- Bilingual visitor information is linked from the existing footer at `/privacy/` and `/el/privacy/`.
- No custom click tracking or conversion measurement was added. Web Analytics does not provide every metric listed in the earlier discussion.
- `_headers` remains available for compatible future hosting; meta CSP deliberately omits the unsupported `frame-ancestors` directive.

## Verification

Build output, Astro checks, existing tag/topic/contact tests, sitemap/contact audits and analytics/CSP audits are checked before release. The analytics audit executes host/duplicate guards and verifies policy placement and inline hashes across all HTML documents. Browser integration checks run in the existing GitHub validation workflow; the local environment has no supported browser QA capability. Actual arrival of measurements in the signed-in Cloudflare dashboard must be verified after deployment.

## References

- [Cloudflare beacon and storage behavior](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [Cloudflare Web Analytics CSP and manual SRI limitations](https://developers.cloudflare.com/web-analytics/faq/)
- [CSP frame-ancestors cannot be delivered through meta](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [GitHub Pages HTTPS enforcement](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

No absence-of-vulnerabilities or blanket legal compliance guarantee is implied by the checks above.
