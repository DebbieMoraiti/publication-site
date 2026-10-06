const base = (process.env.AUDIT_SITE_URL || 'https://debbiemoraiti.github.io/publication-site').replace(/\/$/, '');

async function get(path, expectedType) {
  const response = await fetch(`${base}${path}`, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (expectedType && !type.includes(expectedType)) {
    throw new Error(`${path} has unexpected content-type: ${type}`);
  }
  return expectedType === 'image/png' ? response.arrayBuffer() : response.text();
}

function must(text, fragment, label) {
  if (!text.includes(fragment)) throw new Error(`Missing ${label}: ${fragment}`);
}

function mustNot(text, fragment, label) {
  if (text.includes(fragment)) throw new Error(`Unexpected ${label}: ${fragment}`);
}

const homeUrl = `${base}/`;
const greekHomeUrl = `${base}/el/`;
const articleSlug = 'stelios-sioulas-behind-the-kit';
const articleUrl = `${base}/articles/${articleSlug}/`;
const greekArticleUrl = `${base}/el/articles/${articleSlug}/`;

const [home, greekHome, article, greekArticle, rss, greekRss, sitemap, robots] = await Promise.all([
  get('/', 'text/html'),
  get('/el/', 'text/html'),
  get(`/articles/${articleSlug}/`, 'text/html'),
  get(`/el/articles/${articleSlug}/`, 'text/html'),
  get('/rss.xml', 'application/rss+xml'),
  get('/el/rss.xml', 'application/rss+xml'),
  get('/sitemap.xml', 'application/xml'),
  get('/robots.txt', 'text/plain'),
]);

must(home, `rel="canonical" href="${homeUrl}"`, 'home canonical');
must(home, `hreflang="en" href="${homeUrl}"`, 'English hreflang');
must(home, `hreflang="el" href="${greekHomeUrl}"`, 'Greek hreflang');
must(home, `hreflang="x-default" href="${homeUrl}"`, 'x-default');
must(home, 'name="robots" content="noindex, follow"', 'global noindex');
must(home, '"@type":"Organization"', 'publisher Organization schema');
must(home, '"@type":"CollectionPage"', 'homepage CollectionPage schema');

must(greekHome, `rel="canonical" href="${greekHomeUrl}"`, 'Greek canonical');
must(article, `rel="canonical" href="${articleUrl}"`, 'article canonical');
must(article, 'property="og:type" content="article"', 'article Open Graph type');
must(article, 'name="twitter:card" content="summary_large_image"', 'Twitter large card');
must(article, 'name="robots" content="noindex, follow"', 'draft/global noindex');
must(article, '"@type":"BreadcrumbList"', 'article BreadcrumbList schema');
must(article, '"@type":"Organization"', 'article publisher schema');
must(article, '"@type":"BlogPosting"', 'profile BlogPosting schema');
must(greekArticle, `rel="canonical" href="${greekArticleUrl}"`, 'Greek article canonical');

must(rss, '<language>en</language>', 'English RSS language');
must(greekRss, '<language>el-GR</language>', 'Greek RSS language');
mustNot(rss, articleSlug, 'draft article in English RSS');
mustNot(greekRss, articleSlug, 'draft article in Greek RSS');

must(sitemap, 'hreflang="x-default"', 'sitemap x-default alternate');
mustNot(sitemap, articleSlug, 'draft article in sitemap');
must(robots, 'Disallow: /', 'robots indexing block');

const share = await get('/social-share.png', 'image/png');
if (share.byteLength < 1000) throw new Error('Generated social share image looks unexpectedly small.');

console.log('Deployed SEO/social smoke audit passed.');
