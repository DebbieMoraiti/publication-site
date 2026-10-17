import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://storyfields.gr';
const DIST = resolve('dist');
const STATE = resolve('.indexnow');
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

function safePath(root, pathname) {
  const candidate = resolve(root, '.' + decodeURIComponent(pathname));
  if (candidate !== root && !candidate.startsWith(root + sep)) throw new Error('Invalid sitemap path');
  return candidate;
}

function sitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'"));
  if (!urls.length) throw new Error('No public URLs in generated sitemap');
  return [...new Set(urls.map(raw => {
    const url = new URL(raw);
    if (url.origin !== ORIGIN || url.hash || url.search) throw new Error('Unexpected sitemap URL');
    return url.href;
  }))].sort();
}

async function htmlForUrl(root, href) {
  const pathname = new URL(href).pathname;
  const base = safePath(root, pathname);
  const candidates = pathname.endsWith('/')
    ? [join(base, 'index.html')]
    : [base + '.html', join(base, 'index.html'), base];
  for (const candidate of candidates) {
    try { return (await readFile(candidate)).toString('utf8'); }
    catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
    }
  }
  throw new Error('Sitemap page absent from generated site: ' + pathname);
}

async function referencedImageHashes(root, html, pageUrl) {
  const assets = new Set();
  // Changing an existing image without renaming it must also trigger notification.
  for (const tag of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\b(src|srcset)\s*=\s*(["'])(.*?)\2/gi)) {
      const sources = attr[1].toLowerCase() === 'srcset'
        ? attr[3].split(',').map(piece => piece.trim().split(/\s+/)[0])
        : [attr[3]];
      for (const raw of sources) {
        if (!raw) continue;
        let url;
        try { url = new URL(raw, pageUrl); } catch { continue; }
        if (url.origin !== ORIGIN || !/\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) continue;
        assets.add(url.pathname);
      }
    }
  }

  const hashes = [];
  for (const pathname of [...assets].sort()) {
    try {
      const buffer = await readFile(safePath(root, pathname));
      hashes.push(pathname + ':' + createHash('sha256').update(buffer).digest('hex'));
    } catch (error) {
      // The existing image audit checks for missing assets; do not break IndexNow on optional media.
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return hashes.join('\n');
}

export async function buildManifest(root = DIST) {
  const xml = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const pages = {};
  for (const url of sitemapUrls(xml)) {
    const html = await htmlForUrl(root, url);
    const imageHashes = await referencedImageHashes(root, html, url);
    // The deployment revision changes every build, even if the page content does not.
    const stableHtml = html.replace(/<meta\s+name=["']build-revision["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
    pages[url] = createHash('sha256').update(stableHtml).update('\n').update(imageHashes).digest('hex');
  }
  return { origin: ORIGIN, pages };
}

export function changedUrls(previous, current) {
  if (current?.origin !== ORIGIN || !current.pages || Array.isArray(current.pages)) throw new Error('Invalid current manifest');
  if (previous && (previous.origin !== ORIGIN || !previous.pages || Array.isArray(previous.pages))) throw new Error('Invalid prior manifest');
  const oldPages = previous?.pages ?? {};
  const selected = new Set();
  for (const [url, hash] of Object.entries(current.pages)) {
    if (oldPages[url] !== hash) selected.add(url);
  }
  for (const url of Object.keys(oldPages)) {
    if (!(url in current.pages)) selected.add(url); // Report disappeared URLs, too.
  }
  return [...selected].sort().map(raw => {
    const url = new URL(raw);
    if (url.origin !== ORIGIN || url.search || url.hash) throw new Error('Unexpected manifest URL');
    return url.href;
  });
}

function indexNowKey() {
  const key = process.env.INDEXNOW_API_KEY?.trim() || '';
  if (!KEY_PATTERN.test(key)) throw new Error('INDEXNOW_API_KEY is missing or invalid; expected 8-128 letters, numbers or hyphens.');
  return key;
}

async function proof() {
  const key = indexNowKey();
  await access(DIST);
  await writeFile(join(DIST, key + '.txt'), key, { mode: 0o644 });
  console.log('IndexNow verification file included in deployment (key is not printed).');
}

async function manifest() {
  const next = await buildManifest();
  await mkdir(STATE, { recursive: true });
  await writeFile(join(STATE, 'current.json'), JSON.stringify(next) + '\n');
  console.log('IndexNow manifest includes ' + Object.keys(next.pages).length + ' published URLs.');
}

async function notify() {
  const key = indexNowKey();
  const current = JSON.parse(await readFile(join(STATE, 'current.json'), 'utf8'));
  let previous = null;
  try { previous = JSON.parse(await readFile(join(STATE, 'previous.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const urls = changedUrls(previous, current);
  console.log('IndexNow URLs to submit: ' + urls.length);
  if (urls.length) {
    const keyLocation = ORIGIN + '/' + key + '.txt';
    let ready = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const response = await fetch(keyLocation, {
          redirect: 'error',
          signal: AbortSignal.timeout(12000),
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.status === 200 && (await response.text()).trim() === key) { ready = true; break; }
      } catch { /* Wait for GitHub Pages/CDN propagation. */ }
      if (attempt < 11) await new Promise(done => setTimeout(done, 5000));
    }
    if (!ready) throw new Error('IndexNow ownership proof is not yet available at the live domain.');

    for (let i = 0; i < urls.length; i += 10000) {
      const batch = urls.slice(i, i + 10000);
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ host: 'storyfields.gr', key, keyLocation, urlList: batch })
      });
      if (![200, 202].includes(response.status)) {
        throw new Error('IndexNow submission rejected with HTTP ' + response.status);
      }
      console.log('IndexNow received ' + batch.length + ' URLs (HTTP ' + response.status + ').');
    }
  }
  // Only save the new baseline if every submission has succeeded.
  await copyFile(join(STATE, 'current.json'), join(STATE, 'previous.json'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const commands = { proof, manifest, notify };
  const command = commands[process.argv[2]];
  if (!command) throw new Error('Usage: node scripts/indexnow.mjs proof|manifest|notify');
  await command();
}
