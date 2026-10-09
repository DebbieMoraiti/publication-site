import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const base = (process.env.AUDIT_SITE_URL || 'https://storyfields.gr').replace(/\/$/, '');
const revision = process.env.GITHUB_SHA;
const output = 'responsive-reports';
const articleFiles = (await readdir('src/content/articles')).filter((file) => file.endsWith('.json'));
const articleContent = await Promise.all(articleFiles.map(async (file) => JSON.parse(await readFile(`src/content/articles/${file}`, 'utf8'))));
const publishedCount = articleContent.filter((article) => article.status === 'published').length;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn(process.env.CHROME_PATH || '/usr/bin/google-chrome', [
  '--headless', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=9222', '--user-data-dir=/tmp/storyfields-responsive', 'about:blank',
], { stdio: 'ignore' });
chrome.on('error', (error) => { console.error(error); process.exitCode = 1; });

let socket;
try {
  let target;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
      target = await response.json();
      break;
    } catch { await delay(250); }
  }
  if (!target?.webSocketDebuggerUrl) throw new Error('Chrome did not expose an audit target.');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    const operation = pending.get(message.id);
    if (!operation) return;
    pending.delete(message.id);
    if (message.error) operation.reject(new Error(message.error.message));
    else operation.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  await send('Page.enable');
  await mkdir(output, { recursive: true });
  const results = [];
  const routes = ['', 'contact/', 'articles/after-40-you-dont-start-from-zero/', 'articles/small-moments-big-value/', 'articles/the-prisoners-eightball-sold-out-2026/'];
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 });
    for (const lang of ['en', 'el']) {
      for (const route of routes) {
        const url = `${base}/${lang === 'el' ? 'el/' : ''}${route}`;
        await send('Page.navigate', { url });
        let ready = false;
        for (let attempt = 0; attempt < 120; attempt++) {
          try {
            ready = await evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.querySelector('main h1') && (!${JSON.stringify(revision || '')} || document.querySelector('meta[name="build-revision"]')?.content === ${JSON.stringify(revision || '')})`);
          } catch { ready = false; }
          if (ready) break;
          await delay(250);
        }
        if (!ready) throw new Error(`Page did not load the current deployment: ${url}`);
        await evaluate(`document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; })`);
        let imagesReady = false;
        for (let attempt = 0; attempt < 80; attempt++) {
          imagesReady = await evaluate(`Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)`);
          if (imagesReady) break;
          await delay(250);
        }
        if (!imagesReady) throw new Error(`Missing rendered image: ${url}`);
        const metrics = await evaluate(`(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1: document.querySelectorAll('h1').length,
          brand: document.querySelector('.editorial-brand')?.getAttribute('aria-label'),
          cards: document.querySelectorAll('.story-card').length,
          columns: document.querySelector('.editorial-grid') ? getComputedStyle(document.querySelector('.editorial-grid')).gridTemplateColumns.split(' ').length : null,
          shadow: getComputedStyle(document.querySelector('h1')).textShadow,
          images: document.images.length,
          contact: document.querySelector('.contact-form') ? {
            mode: document.querySelector('.contact-form').dataset.contactMode,
            fields: Array.from(document.querySelectorAll('.contact-field input, .contact-field textarea')).map(field => ({
              name: field.name, label: field.labels?.[0]?.textContent?.trim(), required: field.required, disabled: field.matches(':disabled'),
            })),
            buttonDisabled: document.querySelector('.contact-form button').disabled,
          } : null,
        }))()`);
        if (metrics.width !== width || metrics.scrollWidth > width || metrics.h1 !== 1 || metrics.brand !== 'Storyfields' || metrics.shadow === 'none') {
          throw new Error(`Invalid rendered layout: ${JSON.stringify({ url, metrics })}`);
        }
        if (!route && (metrics.cards !== publishedCount || metrics.columns !== (width > 832 ? 3 : width > 624 ? 2 : 1))) {
          throw new Error(`Invalid homepage grid: ${JSON.stringify({ url, metrics })}`);
        }
        if (route === 'contact/' && (!metrics.contact || metrics.contact.fields.length !== 4 || metrics.contact.fields.some(field => !field.label || !field.required) || (metrics.contact.mode === 'unavailable' && (!metrics.contact.buttonDisabled || metrics.contact.fields.some(field => !field.disabled))))) {
          throw new Error(`Invalid accessible Contact form: ${JSON.stringify({ url, metrics })}`);
        }
        results.push({ lang, route: route || 'home', ...metrics });
        if ([390, 1440].includes(width) && ['', 'contact/', 'articles/small-moments-big-value/'].includes(route)) {
          const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          await writeFile(`${output}/${lang}-${route === 'contact/' ? 'contact' : route ? 'article' : 'home'}-${width}.png`, Buffer.from(screenshot.data, 'base64'));
        }
      }
    }
    console.log(`Responsive layouts and images passed at ${width}px.`);
  }
  await writeFile(`${output}/responsive.json`, `${JSON.stringify({ checks: results.length, revision, results }, null, 2)}\n`);
  console.log(`Passed ${results.length} rendered layout checks in English and Greek.`);
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
}
