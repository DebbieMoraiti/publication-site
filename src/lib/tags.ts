export type Tag = {
  slug: string;
  label: { en: string; el: string };
  aliases?: string[];
};

export const articleTagDisplayLimit = 4;

// Labels can change; canonical slugs and aliases preserve existing URLs.
export function createTagIndex(tags: Tag[]) {
  const index = new Map<string, Tag>();
  for (const tag of tags) {
    for (const lang of ['en', 'el'] as const) {
      if (typeof tag.label?.[lang] !== 'string' || !tag.label[lang].trim()) {
        throw new Error(`Tag "${tag.slug}" requires a ${lang} label.`);
      }
    }
    for (const slug of [tag.slug, ...(tag.aliases ?? [])]) {
      if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(`Invalid tag slug: ${slug}`);
      }
      if (index.has(slug)) throw new Error(`Duplicate tag slug or alias: ${slug}`);
      index.set(slug, tag);
    }
  }
  return index;
}

export function resolveArticleTags(slugs: string[] | undefined, index: Map<string, Tag>) {
  const resolved = new Map<string, Tag>();
  for (const slug of slugs ?? []) {
    const tag = index.get(slug);
    if (!tag) throw new Error(`Unknown tag "${slug}". Add it to the Tags collection first.`);
    if (resolved.has(tag.slug)) throw new Error(`Duplicate article tag: ${tag.slug}`);
    resolved.set(tag.slug, tag);
  }
  return [...resolved.values()];
}

export function publishedTagCatalog(articles: { status: string; tags?: string[] }[], index: Map<string, Tag>) {
  return [...new Map(articles.filter((article) => article.status === 'published')
    .flatMap((article) => resolveArticleTags(article.tags, index))
    .map((tag) => [tag.slug, tag])).values()];
}
