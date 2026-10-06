import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const site = JSON.parse(await readFile('src/config/site.json', 'utf8'));
const hashes = new Set();
const contactFormEnabled = Boolean(site.contact?.formEndpoint);
const embedsEnabled = site.privacy?.allowThirdPartyEmbeds === true;

async function htmlFiles(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(file));
    else if (entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

const pages = await htmlFiles(dist);
if (!pages.length) throw new Error('No HTML pages found for CSP generation.');
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1]) || !match[2]) continue;
    const digest = createHash('sha256').update(match[2], 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
}

const policy = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'", // Astro theme variables and image focal values are inline styles.
  "img-src 'self' data:",
  "font-src 'self' data:",
  "media-src 'self'",
  embedsEnabled
    ? "frame-src https://www.youtube-nocookie.com https://player.vimeo.com"
    : "frame-src 'none'",
  contactFormEnabled
    ? "connect-src 'self' https://formspree.io"
    : "connect-src 'self'",
  contactFormEnabled
    ? "form-action 'self' https://formspree.io"
    : "form-action 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const cspLine = `  Content-Security-Policy: ${policy}`;
if (cspLine.length > 2000) throw new Error('CSP exceeds Cloudflare’s 2,000-character header line limit.');
const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  '  Cross-Origin-Opener-Policy: same-origin',
  '  X-Permitted-Cross-Domain-Policies: none',
  ...(!site.seo.indexable ? ['  X-Robots-Tag: noindex'] : []),
  cspLine,
  '',
].join('\n');
await writeFile(path.join(dist, '_headers'), headers);
console.log(`Generated security headers with ${hashes.size} inline script hash(es) from ${pages.length} pages.`);
