import { readdir, readFile } from 'node:fs/promises';

const base = (process.env.AUDIT_SITE_URL || 'https://storyfields.gr').replace(/\/$/, '');
const expectedRevision = process.env.GITHUB_SHA;
const siteConfig = JSON.parse(await readFile('src/config/site.json', 'utf8'));
const contactConfig = siteConfig.contact;
const indexable = siteConfig.seo.indexable === true;

async function get(path, expectedType, { noindex = false } = {}) {
  const accepted = Array.isArray(expectedType) ? expectedType : expectedType ? [expectedType] : [];
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`${base}${path}`, { redirect: 'follow', cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (indexable && !noindex && accepted.includes('text/html') && /\b(?:noindex|none)\b/i.test(response.headers.get('x-robots-tag') || '')) {
      throw new Error(`${path} has a blocking X-Robots-Tag header.`);
    }
    if (accepted.length && !accepted.some((value) => type.includes(value))) {
      throw new Error(`${path} has unexpected content-type: ${type}`);
    }
    if (accepted.some((value) => value.startsWith('image/'))) return response.arrayBuffer();
    const text = await response.text();
    if (!expectedRevision || !accepted.includes('text/html') || text.includes(`name="build-revision" content="${expectedRevision}"`)) {
      return text;
    }
    if (attempt < 11) await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`${path} is still serving a previous deployment instead of ${expectedRevision}.`);
}

function must(text, fragment, label) {
  if (!text.includes(fragment)) throw new Error(`Missing ${label}: ${fragment}`);
}

function mustNot(text, fragment, label) {
  if (text.includes(fragment)) throw new Error(`Unexpected ${label}: ${fragment}`);
}

function auditIndexing(html, label, noindex = false) {
  const robotsMeta = html.match(/<meta\b[^>]*name="robots"[^>]*>/i)?.[0] || '';
  const blocked = /\b(?:noindex|none)\b/i.test(robotsMeta);
  if (blocked !== (!indexable || noindex)) throw new Error(`Incorrect indexing metadata: ${label}`);
}

const homeUrl = `${base}/`;
const greekHomeUrl = `${base}/el/`;
const articleSlug = 'after-40-you-dont-start-from-zero';
const articleUrl = `${base}/articles/${articleSlug}/`;
const greekArticleUrl = `${base}/el/articles/${articleSlug}/`;

const [home, greekHome, article, greekArticle, rss, greekRss, sitemap, robots] = await Promise.all([
  get('/', 'text/html'),
  get('/el/', 'text/html'),
  get(`/articles/${articleSlug}/`, 'text/html'),
  get(`/el/articles/${articleSlug}/`, 'text/html'),
  get('/rss.xml', 'application/xml'),
  get('/el/rss.xml', 'application/xml'),
  get('/sitemap.xml', 'application/xml'),
  get('/robots.txt', 'text/plain'),
]);

must(home, `rel="canonical" href="${homeUrl}"`, 'home canonical');
must(home, `hreflang="en" href="${homeUrl}"`, 'English hreflang');
must(home, `hreflang="el" href="${greekHomeUrl}"`, 'Greek hreflang');
must(home, `hreflang="x-default" href="${homeUrl}"`, 'x-default');
auditIndexing(home, 'English homepage');
auditIndexing(greekHome, 'Greek homepage');
must(home, '"@type":"Organization"', 'publisher Organization schema');
must(home, '"@type":"CollectionPage"', 'homepage CollectionPage schema');
must(home, '"@type":"WebSite"', 'WebSite schema');
must(home, '/brand/storyfields-wordmark', 'approved masthead');
must(home, 'aria-label="Storyfields"', 'accessible brand name');

must(greekHome, `rel="canonical" href="${greekHomeUrl}"`, 'Greek canonical');
must(article, `rel="canonical" href="${articleUrl}"`, 'article canonical');
must(article, `hreflang="x-default" href="${articleUrl}"`, 'article x-default');
must(article, 'property="og:type" content="article"', 'article Open Graph type');
must(article, 'name="twitter:card" content="summary_large_image"', 'Twitter large card');
auditIndexing(article, 'English article');
auditIndexing(greekArticle, 'Greek article');
must(article, '"@type":"BreadcrumbList"', 'article BreadcrumbList schema');
must(article, '"@type":"Organization"', 'article publisher schema');
must(article, '"@type":"Article"', 'essay Article schema');
must(greekArticle, `rel="canonical" href="${greekArticleUrl}"`, 'Greek article canonical');

must(rss, '<language>en</language>', 'English RSS language');
must(greekRss, '<language>el-GR</language>', 'Greek RSS language');
must(rss, articleSlug, 'published article in English RSS');
must(greekRss, articleSlug, 'published article in Greek RSS');

must(sitemap, 'hreflang="x-default"', 'sitemap x-default alternate');
must(sitemap, articleSlug, 'published article in sitemap');
must(robots, indexable ? 'Allow: /' : 'Disallow: /', 'robots crawl policy');
if (indexable) mustNot(robots, 'Disallow: /', 'global indexing block');
must(robots, `Sitemap: ${base}/sitemap.xml`, 'canonical sitemap declaration');
const imagePreview = await get('/image-preview/', 'text/html', { noindex: true });
auditIndexing(imagePreview, 'image preview', true);
mustNot(sitemap, '/image-preview/', 'image preview in sitemap');

await Promise.all(['en', 'el'].map(async (lang) => {
  const prefix = lang === 'el' ? '/el' : '';
  const path = `${prefix}/contact/`;
  const page = await get(path, 'text/html');
  must(page, `<html lang="${lang}"`, 'Contact language');
  must(page, `rel="canonical" href="${base}${path}"`, 'Contact canonical');
  must(page, `hreflang="en" href="${base}/contact/"`, 'English Contact alternate');
  must(page, `hreflang="el" href="${base}/el/contact/"`, 'Greek Contact alternate');
  must(page, `hreflang="x-default" href="${base}/contact/"`, 'Contact x-default');
  auditIndexing(page, `${lang} Contact`);
  must(page, '"@type":"ContactPage"', 'Contact schema');
  must(page, '"@type":"BreadcrumbList"', 'Contact breadcrumbs');
  must(page, '"@type":"Organization"', 'Contact publisher');
  must(page, '"@type":"WebSite"', 'Contact WebSite schema');
  must(page, 'name="twitter:card" content="summary_large_image"', 'Contact Twitter card');
  must(page, 'property="og:type" content="website"', 'Contact Open Graph');
  for (const field of ['name', 'email', 'subject', 'message']) must(page, `name="${field}"`, `Contact ${field}`);
  must(page, 'aria-describedby="contact-form-note"', 'Contact availability description');
  if (!contactConfig.email && !contactConfig.formEndpoint) {
    must(page, 'data-contact-mode="unavailable"', 'Contact unavailable mode');
    must(page, '<fieldset disabled>', 'Contact disabled input');
    mustNot(page, 'action="https://', 'unconfigured form submission');
    mustNot(page, 'href="mailto:', 'invented contact address');
  } else if (contactConfig.formEndpoint) {
    must(page, `action="${contactConfig.formEndpoint}" method="post"`, 'approved Contact POST endpoint');
    must(page, 'data-contact-mode="endpoint"', 'active Contact mode');
    must(page, `name="${contactConfig.honeypotField}" tabindex="-1" autocomplete="off"`, 'Contact honeypot');
    if (/<(?:fieldset|button)\b[^>]*\bdisabled\b/.test(page)) throw new Error('Native Contact submission must be enabled without JavaScript.');
  }
  must(sitemap, `<loc>${base}${path}</loc>`, 'Contact sitemap route');
  for (const document of [page, lang === 'el' ? greekHome : home]) {
    if ((document.match(new RegExp(`href="${path}"`, 'g')) || []).length < 2) throw new Error('Contact must appear in both navigation and footer.');
  }
}));

const contentFiles = (await readdir('src/content/articles')).filter((file) => file.endsWith('.json'));
const content = await Promise.all(contentFiles.map(async (file) => JSON.parse(await readFile(`src/content/articles/${file}`, 'utf8'))));
const published = content.filter((item) => item.status === 'published');
const drafts = content.filter((item) => item.status !== 'published');
const removedSlugs = ['first-story', 'ideas-placeholder', 'people-placeholder'];
const forbiddenSlugs = [...drafts.map((item) => item.slug), ...removedSlugs];

await Promise.all(drafts.flatMap((item) => ['en', 'el'].map(async (lang) => {
  const path = `${lang === 'el' ? '/el' : ''}/articles/${item.slug}/`;
  auditIndexing(await get(path, 'text/html', { noindex: true }), `${lang} draft ${item.slug}`, true);
})));

await Promise.all([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(async ([, url]) => {
  const path = new URL(url).pathname;
  auditIndexing(await get(path, 'text/html'), `sitemap page ${path}`);
}));

for (const [label, document] of Object.entries({ home, greekHome, rss, greekRss, sitemap })) {
  for (const slug of forbiddenSlugs) mustNot(document, slug, `${label} unpublished content`);
}
if ((home.match(/class="story-card"/g) || []).length !== published.length) throw new Error('Homepage story grid differs from published content.');
if ((rss.match(/<item>/g) || []).length !== published.length) throw new Error('RSS differs from published content.');
if ((greekRss.match(/<item>/g) || []).length !== published.length) throw new Error('Greek RSS differs from published content.');

await Promise.all(published.flatMap((item) => ['en', 'el'].map(async (lang) => {
  const prefix = lang === 'el' ? '/el' : '';
  const path = `${prefix}/articles/${item.slug}/`;
  const url = `${base}${path}`;
  const page = await get(path, 'text/html');
  must(page, `<html lang="${lang}"`, 'page language');
  must(page, `rel="canonical" href="${url}"`, 'article canonical');
  must(page, `hreflang="en" href="${base}/articles/${item.slug}/"`, 'English article alternate');
  must(page, `hreflang="el" href="${base}/el/articles/${item.slug}/"`, 'Greek article alternate');
  must(page, `hreflang="x-default" href="${base}/articles/${item.slug}/"`, 'article x-default');
  auditIndexing(page, `${lang} article ${item.slug}`);
  must(page, 'property="og:type" content="article"', 'Open Graph article');
  must(page, 'name="twitter:card" content="summary_large_image"', 'Twitter card');
  must(page, '"@type":"BreadcrumbList"', 'article breadcrumbs');
  must(page, `"@type":"${item.type === 'essay' ? 'Article' : 'BlogPosting'}"`, 'article schema');
  must(page, 'class="article-related"', 'related stories');
  must(page, 'class="article-pager"', 'article navigation');
  must(page, 'class="responsive-image responsive-image--hero"', 'responsive hero');
  must(page, 'width=', 'image dimensions');
  if (item.slug === 'the-prisoners-eightball-sold-out-2026') {
    must(page, lang === 'el' ? 'δύο διαφορετικά κοστούμια του Eddie' : 'Two different Eddie costumes', 'Eddie editorial update');
    must(page, lang === 'el' ? 'Δείτε: ο Eddie στη σκηνή' : 'Watch: Eddie on stage', 'Eddie video label');
    must(page, 'href="https://www.facebook.com/share/v/1DThvLJayf/" target="_blank" rel="noopener noreferrer"', 'safe Facebook external link');
    mustNot(page, '<iframe', 'third-party video embed');
  }
  for (const slug of forbiddenSlugs) mustNot(page, slug, 'unpublished related story');
})));

const share = await get('/social-share.png', 'image/png');
if (share.byteLength < 1000) throw new Error('Generated social share image looks unexpectedly small.');

console.log('Deployed SEO/social smoke audit passed.');
