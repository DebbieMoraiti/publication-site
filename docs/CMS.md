# Editing the publication with Pages CMS

Pages CMS edits the publication content stored in this GitHub repository. The
publication branch exposes editorial content and media only. Technical settings
such as the final domain, indexing, deployment, security headers and build
configuration stay outside the CMS and require code review.

## Connect the publication branch

1. Go to Pages CMS and sign in with GitHub.
2. Open this repository and select the `publication-bootstrap` branch while the
   publication is still in development.
3. Pages CMS reads `.pages.yml` from the selected branch.
4. Do not edit the Artist Website Starter production `main` branch through this
   publication workflow.

## Publication identity

**Publication / Ταυτότητα** controls the temporary publication name, tagline and
homepage introduction. The name can stay as `Working Title` until the final
brand and domain are chosen.

## Articles

Articles are stored as individual JSON files under `src/content/articles/`.

Use **Articles → New** in Pages CMS to create a story. The CMS creates one file per article and lets you select the author and topic from existing collections.

Each story has:

- a unique lowercase `slug`;
- a format such as feature, profile, essay or interview;
- `draft` or `published` status;
- one publication date;
- an author slug;
- a topic slug;
- optional tags;
- bilingual title, summary and display topic;
- optional hero image and bilingual alt text;
- bilingual paragraph lists for the article body.

### Drafts and publishing

Keep a story as **draft** while writing or reviewing it. Draft article routes are
built for preview but use `noindex`, and drafts are excluded from the sitemap
and RSS feed.

Change status to **published** only when the story is ready to be public. Before
publishing, confirm:

- English and Greek copy are intentional;
- author and topic slugs exist;
- the publication date is correct;
- hero image rights/permission are clear;
- meaningful images have useful alt text;
- no private contact details, location data or other sensitive personal data
  are present;
- external claims and links have been checked.

### Featured story

Only one article should have **Featured on homepage** enabled at a time. The
build validates this rule.

## Authors

Authors are stored as individual JSON files under `src/content/authors/`.

The `slug` is the stable internal identifier referenced by articles. Public
name, role and bio can be edited later without changing article references.

Only add public professional links. Never add private email addresses, private
social profiles or personal contact information.

## Topics and tags

Topics are stored as individual JSON files under `src/content/topics/`. They are curated sections such as People, Ideas, Culture, Music and Digital.
Each topic has a stable slug and bilingual display label.

Tags are lighter metadata added directly to articles. Keep them lowercase,
short and reusable. Do not create near-duplicates such as `web`, `websites`
and `website` unless there is a deliberate distinction.

## Images

Uploads go to `public/uploads/`. Accepted formats are JPG, JPEG, PNG, WebP and
AVIF.

Before committing photographs:

- confirm permission to publish them;
- remove sensitive EXIF/GPS metadata when needed;
- use a suitable web resolution;
- provide bilingual alt text for meaningful images.

The existing build pipeline retains the starter's image/security protections,
but source uploads can still remain in Git history.

## Review workflow

1. Save the CMS entry.
2. Review the generated Git commit.
3. Open the branch preview.
4. Check the article in both languages.
5. Check mobile layout, links, image crop, author/topic/tag pages and archive.
6. Only then change the story to `published`.

The final publication will receive its own repository before launch. The current
branch is an implementation workspace and must not be merged into the Artist
Website Starter production branch.
