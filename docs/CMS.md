# Editing the publication with Pages CMS

Pages CMS edits editorial content directly in the `DebbieMoraiti/publication-site` repository. The publication now uses its own `main` branch; it is no longer tied to the Artist Website Starter repository.

Technical settings such as the final domain, indexing, deployment workflow and security headers remain code-reviewed outside the CMS.

## Open the CMS

1. Sign in to Pages CMS with GitHub.
2. Open `DebbieMoraiti/publication-site`.
3. For the protected publishing workflow, create a fresh content branch from the latest `main` in GitHub, then select that branch in Pages CMS. See [Publishing with checked pull requests](PUBLISHING.md).
4. Pages CMS reads the root `.pages.yml` configuration.
5. Every saved content change creates a Git commit on the selected branch. Open a pull request to run validation. The live deployment runs after an approved merge into `main`.

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
8. **Tags** — choose 2–4 specific entries from the shared **Tags / Ετικέτες** collection. Search using Greek, English or the stable slug.
9. **English and Greek title**.
10. **English and Greek summary/dek**.
11. Optional **hero image** and bilingual alt text.
12. **Article sections**.

## Article sections

New articles use structured sections rather than one large text field.

Available section types:

- **Paragraph / Παράγραφος** — normal body copy, with optional inline links.
- **Subheading / Υπότιτλος ενότητας** — divides longer pieces into readable sections.
- **Quote / Απόσπασμα** — highlighted quotation with optional attribution.

Every section stores English and Greek text together, which keeps both language versions structurally aligned.

Older draft articles that still use the legacy paragraph-array `body` continue to render. Pages CMS uses merge mode so those legacy keys are preserved during edits until an article is converted to the new section model.

### Inline links / Σύνδεσμοι μέσα στις παραγράφους

Στο **Paragraph / Παράγραφος → Text / Κείμενο**, γράψε `[κείμενο συνδέσμου](URL)` απευθείας στο ελληνικό ή αγγλικό πεδίο. Μόνο το κείμενο μέσα στις αγκύλες γίνεται σύνδεσμος· η υπόλοιπη παράγραφος παραμένει κανονικό κείμενο. Δεν χρειάζεται αλλαγή σε Astro ή JSON.

Εξωτερικός σύνδεσμος / External link:

```text
Οι [Obscurus Rex](https://obscurusrex.com/) εμφανίστηκαν μαζί με τη Doro.
Discover [Obscurus Rex](https://obscurusrex.com/).
```

Περισσότεροι σύνδεσμοι στην ίδια παράγραφο / Multiple links in one paragraph:

```text
Οι [Obscurus Rex](https://obscurusrex.com/) έπαιξαν μαζί με τους [The Prisoners](/el/articles/the-prisoners-eightball-sold-out-2026/).
[Obscurus Rex](https://obscurusrex.com/) played alongside [The Prisoners](/articles/the-prisoners-eightball-sold-out-2026/).
```

- Use the published article's exact path. Storyfields uses `/el/articles/.../` for Greek and `/articles/.../` for English, its default language; there is no `/en/` prefix in the current site.
- Public external links require a full `https://` URL and open in a new tab with an accessible announcement. Credentials, single-label hosts, local hostname suffixes, IP literals, other protocols and ambiguous URLs are not accepted.
- Internal links start with one `/` and open in the same tab. Bare relative paths, protocol-relative `//...` links and backslashes are not accepted.
- Only inline links are interpreted. HTML, image syntax, link titles and nested/escaped Markdown labels are not supported. Malformed or unsafe links are displayed literally as ordinary escaped text, so check the preview for visible `[...](...)` after saving.
- Spaces in URLs should be encoded as `%20`. URL parentheses may be balanced or encoded as `%28` and `%29`.
- The same link syntax also works in legacy `body` paragraphs. Existing plain paragraphs need no conversion. Headings, quotations, summaries and titles retain their existing plain-text behavior.
- Reading time counts the visible link labels rather than words inside the URL.

The JSON structure remains `type: "paragraph"` with localized `text.el` / `text.en` strings. Keep useful reporting/interview sources as separate **External link** sections when they help readers find the references.

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
- bilingual tag labels and unique canonical slugs/compatibility aliases;
- lowercase reusable tag format and references to existing catalog entries;
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

**Active on website / Ενεργή στο site** controls visibility throughout the website. Missing values preserve the original active behavior. `culture` is currently inactive: its menu entry, homepage tile, topic routes and any associated article routes, listings, tag catalogs, related stories, RSS and sitemap entries are suppressed. Its JSON, translations and images remain stored. Turn the switch back on to restore the section on the next successful build. A build clears old output so disabled routes cannot survive from a previous build.

## Tags

Tags live in `src/content/tags/`. Articles continue to store a list of stable slugs, so the article JSON structure is unchanged. The CMS offers a searchable multiple-reference field rather than free-text entry. See the [Pages CMS reference field documentation](https://pagescms.org/docs/configuration/fields/reference/).

Select 2–4 specific, reusable tags. The article header displays the first four in the stored order, in the reader's language. Older additional entries stay available for taxonomy pages and related-story matching, preserving existing tag URLs. Unused tags and tags used only by drafts do not create public pages; draft headers link only to existing public tag pages.

For example, `cats` displays **Γάτες** in Greek and **Cats** in English; `small-joys` displays **Μικρές χαρές** / **Small joys**. Tag page headings, metadata and article schema keywords use the same localized labels. Artist and venue names keep their official spelling.

Use the existing three homepage topics (**Άνθρωποι, Μουσική, Καθημερινότητα**) for broad navigation; tags describe more specific subjects. Prefer reusing an existing tag instead of creating variations such as `website`, `websites` and `web-site`.

To add a genuinely new subject, first create an entry under **Tags / Ετικέτες** with a lowercase Latin slug and both Greek and English labels, then select it in an article. Edit the labels to rename it without changing its slug or URL. Removing an entry still referenced by an article causes the build to fail.

`heavy-metal` is a compatibility alias of `metal`: both old addresses remain functional, while new links and the sitemap use `metal`. Alias pages use the canonical tag's localized title, article list, canonical URL and language alternatives. Compatibility aliases are read-only in the CMS and maintained through code review.

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

1. Create a fresh content branch from the latest `main` and select it in Pages CMS.
2. Create or edit the article there; keep new work as `draft` while reviewing it.
3. Save and open a pull request targeting `main`.
4. Wait for **Publication validation**, job `validation`, to pass.
5. Review the English and Greek copy, section order, image crop, author/topic/tag links and archive placement. Use a preview or the available reports for layout checks when needed.
6. Make corrections on the same content branch. New commits rerun PR validation.
7. If the article is ready to be public, set it to `published` on that branch. If it should lead the homepage, enable `featured` and make sure no other article is featured. Preserve existing publication status when only correcting an already published article.
8. Merge only after approving the changes and successful checks. Wait for the existing deployment workflow to succeed.
9. Start the next task from a new branch based on the updated `main`.

The repository administrator enables required pull requests and checks only after a CMS branch save and PR validation have been verified. See [Publishing with checked pull requests](PUBLISHING.md) for the exact settings.

You should not need to edit Astro code to create a normal article, author or topic.
