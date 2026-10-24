import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Audit our own built routes and assets. External destinations need separate checks.
const htmlLink = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function decodeAttribute(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#(?:x[0-9a-f]+|\d+));/gi, (entity) => {
    const text = entity.slice(1, -1).toLowerCase();
    if (text.startsWith('#x')) return String.fromCodePoint(parseInt(text.slice(2), 16));
    if (text.startsWith('#')) return String.fromCodePoint(Number(text.slice(1)));
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[text] ?? entity;
  });
}

export function getInternalTargets(html, sourceRoute, siteUrl) {
  const origin = new URL(siteUrl);
  const base = new URL(sourceRoute, origin);
  const results = [];
  for (const match of html.matchAll(htmlLink)) {
    const href = decodeAttribute(match[1] ?? match[2] ?? '');
    let target;
    try { target = new URL(href, base); }
    catch { results.push({ href, error: 'Invalid URL' }); continue; }
    if (['mailto:', 'tel:'].includes(target.protocol)) continue;
    if (target.protocol !== 'https:' && target.protocol !== 'http:') {
      results.push({ href, error: 'Unsupported link protocol ' + target.protocol });
      continue;
    }
    if (target.hostname !== origin.hostname || target.port !== origin.port) continue;
    if (target.protocol !== origin.protocol) {
      results.push({ href, error: 'Non-HTTPS link to our own site' });
      continue;
    }
    let pathname;
    try { pathname = decodeURIComponent(target.pathname); }
    catch { results.push({ href, error: 'Invalid URL encoding' }); continue; }
    if (pathname.includes('\0') || pathname.includes('\\')) {
      results.push({ href, error: 'Unsafe URL path' });
      continue;
    }
    const key = pathname.replace(/^\/+/, '');
    results.push({ href, fragment: target.hash ? target.hash.slice(1) : '', candidates: pathname.endsWith('/') ? [key + 'index.html'] : [key, key + '/index.html'] });
  }
  return results;
}

export async function checkInternalLinks(root = 'dist', siteUrl = 'https://storyfields.gr') {
  const files = new Map();
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.set(relative(root, full).split(sep).join('/'), full);
    }
  }
  await walk(root);
  let checked = 0;
  const broken = [];
  for (const [key, full] of files) {
    if (!key.endsWith('.html')) continue;
    const sourceRoute = key === 'index.html' ? '/' : key.endsWith('/index.html') ? '/' + key.slice(0, -'index.html'.length) : '/' + key;
    const html = await readFile(full, 'utf8');
    for (const entry of getInternalTargets(html, sourceRoute, siteUrl)) {
      if (entry.error) { broken.push(key + ': ' + entry.href + ' (' + entry.error + ')'); continue; }
      checked++;
      const destination = entry.candidates.find(candidate => files.has(candidate));
      if (!destination) {
        broken.push(key + ': ' + entry.href + ' (target not in build output)');
      } else if (entry.fragment && destination.endsWith('.html')) {
        let fragment;
        try { fragment = decodeURIComponent(entry.fragment); }
        catch { broken.push(key + ': ' + entry.href + ' (invalid fragment encoding)'); continue; }
        const targetHtml = await readFile(files.get(destination), 'utf8');
        const ids = [...targetHtml.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
          .map(match => decodeAttribute(match[1] ?? match[2]));
        const namedAnchors = [...targetHtml.matchAll(/<a\b[^>]*\bname\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
          .map(match => decodeAttribute(match[1] ?? match[2]));
        if (!ids.includes(fragment) && !namedAnchors.includes(fragment)) {
          broken.push(key + ': ' + entry.href + ' (fragment not found in target page)');
        }
      }
    }
  }
  return { pages: [...files.keys()].filter(x => x.endsWith('.html')).length, checked, broken };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const site = JSON.parse(await readFile('src/config/site.json', 'utf8'));
  const { pages, checked, broken } = await checkInternalLinks('dist', process.env.PUBLIC_SITE_URL || site.seo.siteUrl);
  if (broken.length) {
    console.error('Broken internal links (' + broken.length + '):\n' + broken.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Internal link audit passed: ' + checked + ' links from ' + pages + ' built HTML pages.');
  }
}
