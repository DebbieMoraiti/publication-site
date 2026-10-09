# Editing the publication with Pages CMS

Pages CMS edits editorial content directly in the `DebbieMoraiti/publication-site` repository. The publication now uses its own `main` branch; it is no longer tied to the Artist Website Starter repository.

Technical settings such as the final domain, indexing, deployment workflow and security headers remain code-reviewed outside the CMS.

## Open the CMS

1. Sign in to Pages CMS with GitHub.
2. Open `DebbieMoraiti/publication-site`.
3. Work on the `main` branch.
4. Pages CMS reads the root `.pages.yml` configuration.
5. Every saved content change creates a Git commit and triggers the publication preview deployment.

## Publication identity

**Publication / Ταυτότητα** controls the working publication name, tagline and homepage introduction.

The working name can remain `Working Title` until branding and the final domain are chosen.

## Create a new article

Open **Articles / Άρθρα → New**.

Complete:

1. **Slug** — lowercase Latin letters, digits and hyphens only. This becomes part of the permanent article URL, so avoid changing it after publication.
2. **Format** — feature, profile, essay, interview, review or short update.
3. **Status** — leave new work as `draft`.
4. **Featured** — enable only when the article should be the single featured homepage story.
5. **Publication date**.
6. **Author** — select an existing author from the Authors collection.
7. **Topic** — select an existing curated topic.
8. **Tags** — optional reusable lowercase tags such as `music`, `live-music`, `web`.
9. **English and Greek title**.
10. **English and Greek summary/dek**.
11. Optional **hero image** and bilingual alt text.
12. **Article sections**.

## Article sections

New articles use structured sections rather than one large text field.

Available section types:

- **Paragraph / Παράγραφος** — normal body copy.
- **Subheading / Υπότιτλος ενότητας** — divides longer pieces into readable sections.
- **Quote / Απόσπασμα** — highlighted quotation with optional attribution.

Every section stores English and Greek text together, which keeps both language versions structurally aligned.

Older draft articles that still use the legacy paragraph-array `body` continue to render. Pages CMS uses merge mode so those legacy keys are preserved during edits until an article is converted to the new section model.

## Drafts and publishing

Keep an article as **draft** while writing or reviewing it.

Drafts remain in the repository and CMS, but are excluded from the public homepage, article routes, archives, related stories, RSS and sitemap. This applies while indexing is disabled as well. Set the status to **published** when the English and Greek copy is ready.

Draft routes are built for preview, but:

- they carry `noindex`;
- they are excluded from RSS;
- they are excluded from the public sitemap when indexing is enabled.

Change the status to **published** only when the article is ready.

The build rejects publication when required structural rules are broken.

## Build validation

The publication validates:

- unique article, author and topic slugs;
- lowercase slug format;
- supported article types;
- `draft` / `published` status;
- real `YYYY-MM-DD` dates;
- existing author references;
- existing topic references;
- required English and Greek titles;
- required English and Greek summaries;
- lowercase reusable tag format;
- duplicate tags within an article;
- maximum one featured article;
- HTTPS-only public author links;
- hero images coming from `/uploads/`;
- bilingual alt text when a hero image is present;
- supported section types;
- bilingual text for every structured section;
- real article content before an article can be `published`.

A bad CMS save may exist as a Git commit, but it will not produce a successful deployment until the validation error is corrected.

## Authors

Authors live in `src/content/authors/`.

The author `slug` is the stable internal ID used by articles. The public name, role, bio and professional links may be edited later without changing article references.

Only add intentionally public professional links.

## Topics

Topics live in `src/content/topics/`.

Topics are curated, relatively broad sections such as:

- People
- Ideas
- Culture
- Music
- Digital

The article stores only the topic slug. The visible bilingual topic label comes from the Topics collection, so renaming a topic label updates all related article displays without editing every article.

## Tags

Tags are lighter metadata stored directly on articles.

Keep them:

- lowercase;
- short;
- reusable;
- Latin-letter slugs with hyphens.

Prefer reusing an existing tag instead of creating small variations such as `website`, `websites` and `web-site`.

## Images

CMS uploads go to `public/uploads/`.

Accepted source formats:

- JPG / JPEG
- PNG
- WebP
- AVIF

The build creates responsive image variants and sanitizes deployed uploads. Source files can still remain in Git history, so sensitive EXIF/GPS metadata should be removed before committing photographs.

When an article uses a meaningful hero image, supply both English and Greek alt text.

## Recommended review workflow

1. Create or edit the article in Pages CMS.
2. Keep it as `draft`.
3. Save.
4. Wait for the GitHub Pages preview workflow to succeed.
5. Open the article in English and Greek.
6. Check mobile layout, section order, image crop, author/topic/tag links and archive placement.
7. Correct the CMS entry if needed.
8. When the content is final, change status to `published`.
9. If it should lead the homepage, enable `featured` and make sure no other article is featured.

You should not need to edit Astro code to create a normal article, author or topic.
