# New client site

The starter is a reusable source, not a shared multisite installation. Give
each artist a separate GitHub repository, Cloudflare Worker and access list.
Use the [client checklist](../CLIENT-CHECKLIST.md) for the actual handoff.

1. After the finished starter is merged into its default branch and marked as
   a GitHub template, choose **Use this template → Create a new repository**.
   Select the intended owner and **leave “Include all branches” unchecked**.
   This gives the client an independent history. Do not fork the starter.
2. Clone the new repository, run `npm ci`, `npm run check`, and `npm run build`.
   Change `name` in `wrangler.jsonc` to a unique Worker name for the client.
   Keep `assets.directory` at `./dist` and previews enabled.
3. Replace `src/content/artist.json` and all sample entries/text in the other
   `src/content/*.json` files. Change `src/config/site.json` for languages,
   time zone, SEO and domain; edit `src/config/modules.json` for sections and
   `src/config/theme.json` for visual identity. The site supports `en` and
   `el`, with one at `/` and the other at `/en/` or `/el/`.
4. Add images under `public/uploads/`, provide translated alt text and check
   focal values in `/image-preview/`. Leave unavailable content, form, audio,
   and press kit disabled or blank. Keep `seo.indexable: false` while building.
5. In the client's Cloudflare account, connect the **new repository** to a
   Worker whose dashboard name matches `wrangler.jsonc`. Set `main` as the
   production branch. Use `npm run build` as build command, `npx wrangler
   deploy` for production and the configured non-production preview command
   `npx wrangler versions upload` for this project. Enable builds for other
   branches if previews are wanted. Check the actual build settings in the
   dashboard before the first deployment, as provider defaults may change.
6. Install/authorize Pages CMS for the **new repository only** and test it
   using [the CMS guide](CMS.md). If used, configure a client-owned Formspree
   project according to [the form guide](FORMSPREE.md). Do not reuse the
   starter's service connections or another artist's account.
7. Push a client branch and check its Cloudflare preview, both languages,
   forms if configured, links, and real responsive content. Attach the final
   domain using [the domain guide](DOMAIN-DNS.md). Merge only the reviewed
   result into the client's `main`.
8. When the real HTTPS domain and every page are verified, set
   `seo.indexable: true`, build, deploy, and complete the handoff checklist.

GitHub's [template repository instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
explain the independent-history creation flow. Cloudflare's
[Workers Builds guide](https://developers.cloudflare.com/workers/ci-cd/builds/)
describes the Git connection and branch previews.
