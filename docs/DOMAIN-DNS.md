# Domain and DNS for a client Worker

Use the client's own domain and Cloudflare zone. The starter's `workers.dev`
hostname in `src/config/site.json` is only a demonstration value. Do not
change DNS for another artist's domain.

1. Choose the final canonical hostname, for example `example.com` **or**
   `www.example.com`. Record who owns the registrar account, renewal and DNS
   access. Make the domain an active zone in the client's Cloudflare account.
2. Deploy and verify the client's Worker first. Its `wrangler.jsonc` name must
   match the Worker in Cloudflare. In **Workers & Pages → Worker → Settings →
   Domains & Routes → Add → Custom Domain**, add the chosen hostname. Cloudflare
   creates the DNS record and certificate for that hostname. Resolve any
   existing CNAME conflict first; do not overwrite a record without checking
   what it currently serves.
3. If both apex and `www` must work, configure the second hostname and an
   explicit **Single Redirect** to the canonical one in Cloudflare Rules.
   The incoming hostname must have a proxied DNS record for that rule to run.
   Do not assume that adding a single Custom Domain creates a redirect for
   the other hostname. After an edge certificate is active, use the zone's
   HTTPS redirect setting or a suitable rule, then test HTTP→HTTPS and the
   chosen `www`/apex redirect in a browser.
4. Set `seo.siteUrl` in `src/config/site.json` to the final **HTTPS origin**
   only: `https://example.com` with no path. It is used for canonical,
   hreflang, Open Graph, JSON-LD, sitemap and robots. Rebuild and verify
   `/`, `/el/` or `/en/`, `/live/` when enabled, `/robots.txt`, and
   `/sitemap.xml` on the final domain. Preview builds intentionally remain
   noindex; their canonical links point to the configured production origin.
5. Once real content and redirects are verified, change `seo.indexable` from
   `false` to `true` and deploy. Confirm the generated `noindex` meta tag,
   `X-Robots-Tag: noindex` header and robots disallow rule have gone from the
   production pages. The `/image-preview/` utility page remains noindex.
   Verify the TLS certificate, security headers, images and external links.

Cloudflare's [Workers Custom Domains guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
lists the current prerequisites and dashboard steps; its
[Single Redirect instructions](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/)
cover the other hostname. For an existing DNS
provider or a domain already serving a site, plan the cutover and any mail
records before changing nameservers or host records.
