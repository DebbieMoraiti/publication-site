import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseInlineLinks } from '../src/lib/inline-links.ts';

const site = JSON.parse(await readFile('src/config/site.json', 'utf8'));
const files = (await readdir('src/content/articles')).filter((file) => file.endsWith('.json'));
const articles = await Promise.all(files.map(async (file) => JSON.parse(await readFile(`src/content/articles/${file}`, 'utf8'))));
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const decode = (html) => html.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity.startsWith('#')) return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity];
});
const visibleText = (html) => decode(html.replace(/<span\b[^>]*class="visually-hidden"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]*>/g, ''));

async function htmlFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const file = join(folder, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  }))).flat();
}

let paragraphs = 0;
let links = 0;

for (const language of site.localization.languages) {
  const lang = language.code;
  const prefix = lang === site.localization.defaultLanguage ? '' : `${lang}/`;
  const [home, archive, rss] = await Promise.all([
    readFile(`dist/${prefix}index.html`, 'utf8'),
    readFile(`dist/${prefix}archive/index.html`, 'utf8'),
    readFile(`dist/${prefix}rss.xml`, 'utf8'),
  ]);
  for (const article of articles) {
    const html = await readFile(`dist/${prefix}articles/${article.slug}/index.html`, 'utf8');
    const body = html.match(/<div class="article-body">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(body, `Missing article body: ${lang}/${article.slug}`);
    const rendered = [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]);
    const copy = article.sections?.length
      ? article.sections.filter((section) => ['paragraph', 'quote'].includes(section.type)).map((section) => ({ text: section.text[lang], inline: section.type === 'paragraph' }))
      : (article.body?.[lang] ?? []).map((text) => ({ text, inline: true }));
    assert.equal(rendered.length, copy.length, `Paragraph count: ${lang}/${article.slug}`);
    for (const [i, paragraph] of copy.entries()) {
      const segments = paragraph.inline ? parseInlineLinks(paragraph.text) : [{ type: 'text', text: paragraph.text }];
      assert.equal(visibleText(rendered[i]), segments.map((segment) => segment.text).join(''), `Changed paragraph copy: ${lang}/${article.slug}/${i}`);
      paragraphs++;
    }
    const expected = copy.flatMap((paragraph) => paragraph.inline ? parseInlineLinks(paragraph.text).filter((segment) => segment.type === 'link') : []);
    const anchors = [...body.matchAll(/<a\b([^>]*\bclass="article-inline-link"[^>]*)>([\s\S]*?)<\/a>/g)];
    assert.equal(anchors.length, expected.length, `Inline anchor count: ${lang}/${article.slug}`);
    for (const [i, [, attributes, text]] of anchors.entries()) {
      const segment = expected[i];
      const href = decode(attributes.match(/\bhref="([^"]*)"/)?.[1] || '');
      assert.equal(href, segment.href);
      assert.equal(visibleText(text), segment.text);
      assert.ok(!/\son\w+=/i.test(attributes), 'No injected event attributes');
      if (segment.external) {
        assert.match(attributes, /\btarget="_blank"/);
        assert.match(attributes, /\brel="noopener noreferrer"/);
        assert.match(attributes, /\breferrerpolicy="no-referrer"/);
        assert.ok(text.includes(lang === 'el' ? '(ανοίγει σε νέα καρτέλα)' : '(opens in a new tab)'), 'Localized new-tab announcement');
      } else {
        assert.ok(!/\b(?:target|rel)=/.test(attributes), 'Internal links must stay in the same tab');
        const pathname = decodeURIComponent(new URL(href, site.seo.siteUrl).pathname);
        let file = join('dist', pathname);
        try {
          if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        } catch {
          file = join(file, 'index.html');
        }
        await readFile(file, 'utf8');
      }
      links++;
    }
    if (article.status === 'draft') {
      assert.match(html, /name="robots" content="noindex, follow"/);
      for (const [label, document] of Object.entries({ home, archive, rss, sitemap })) {
        assert.ok(!document.includes(`/articles/${article.slug}/`), `Draft leaked to ${lang}/${label}`);
      }
    }
  }
}

const pages = await htmlFiles('dist');
const documents = await Promise.all(pages.map(async (file) => ({ file, html: await readFile(file, 'utf8') })));
for (const article of articles.filter((article) => article.status === 'draft')) {
  const previewFiles = new Set(site.localization.languages.map(({ code }) => join('dist', code === site.localization.defaultLanguage ? '' : code, 'articles', article.slug, 'index.html')));
  const draftPaths = new Set(site.localization.languages.map(({ code }) => `/${code === site.localization.defaultLanguage ? '' : `${code}/`}articles/${article.slug}`));
  for (const { file, html } of documents) {
    if (previewFiles.has(file)) continue;
    for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]*)"/g)) {
      const url = new URL(decode(href), site.seo.siteUrl);
      if (url.origin !== new URL(site.seo.siteUrl).origin) continue;
      assert.ok(!draftPaths.has(url.pathname.replace(/\/+$/, '')), `Draft linked from a public page: ${file}`);
    }
  }
}

console.log(`Inline link rendering passed: ${paragraphs} unchanged paragraphs, ${links} safe links, both languages and draft exclusion across ${pages.length} HTML pages.`);
