import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'astro';
import { parseInlineLinks, safeInlineDestination } from '../src/lib/inline-links.ts';
import { readingTime } from '../src/lib/editorial-format.ts';

const plain = (text) => [{ type: 'text', text }];
const link = (text, href, external = true) => ({ type: 'link', text, href, external });

test('preserves plain copy exactly, including Unicode, HTML and whitespace', () => {
  for (const text of ['', 'Απλό ελληνικό κείμενο. English & Ελληνικά — 🎵.', '  leading\tand\ntrailing  ', '<script>alert(1)</script>', '<img src=x onerror="alert(1)">', '&lt;img src=x onerror=alert(1)&gt;', 'Just [brackets] and (parentheses).', '**bold** and _italics_ stay plain.']) {
    assert.deepEqual(parseInlineLinks(text), plain(text));
  }
});

test('keeps Greek and English text before and after a link', () => {
  assert.deepEqual(parseInlineLinks('Οι [Obscurus Rex](https://obscurusrex.com/) εμφανίστηκαν μαζί με τη Doro.'), [
    ...plain('Οι '), link('Obscurus Rex', 'https://obscurusrex.com/'), ...plain(' εμφανίστηκαν μαζί με τη Doro.'),
  ]);
  assert.deepEqual(parseInlineLinks('Read [Ελληνική ιστορία](/el/articles/story/) today.'), [
    ...plain('Read '), link('Ελληνική ιστορία', '/el/articles/story/', false), ...plain(' today.'),
  ]);
});

test('handles adjacent links, multiple links and sentence punctuation', () => {
  assert.deepEqual(parseInlineLinks('[One](https://example.com)[Δύο](/en/articles/two/) και [Three](https://example.org/?a=1&b=2).'), [
    link('One', 'https://example.com/'), link('Δύο', '/en/articles/two/', false), ...plain(' και '),
    link('Three', 'https://example.org/?a=1&b=2'), ...plain('.'),
  ]);
});

test('supports balanced URL parentheses and escaped text labels without HTML interpretation', () => {
  assert.deepEqual(parseInlineLinks('[Title](https://example.com/wiki/Title_(detail))!'), [
    link('Title', 'https://example.com/wiki/Title_(detail)'), ...plain('!'),
  ]);
  const label = '<img src=x onerror="alert(1)"> & "quotes"';
  assert.deepEqual(parseInlineLinks(`[${label}](https://example.com/)`), [link(label, 'https://example.com/')]);
});

for (const href of [
  'https://obscurusrex.com/',
  'https://rockpages.gr/doro-obscurus-rex-floyd-9-10-2026/?lang=en',
  'HTTPS://EXAMPLE.COM/path',
  'https://example.com/a%20space?q=one&lang=el#section',
  'https://παράδειγμα.gr/μουσική',
  'https://example.com/wiki/Title_(detail)',
  'https://example.com./',
]) {
  test(`accepts public HTTPS domain: ${href}`, () => {
    assert.deepEqual(safeInlineDestination(href), { href: new URL(href).href, external: true });
  });
}

for (const href of ['/', '/el/articles/story/', '/en/articles/story/', '/articles/story/', '/el/articles/ιστορία/', '/articles/a%20space/', '/articles/story/?ref=home&lang=en#section']) {
  test(`keeps root-relative internal link in the same tab: ${href}`, () => {
    assert.deepEqual(safeInlineDestination(href), { href, external: false });
  });
}

for (const href of [
  'javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)', 'file:///etc/passwd', 'http://example.com/', 'ftp://example.com/',
  'mailto:editor@example.com', 'tel:12345', 'blob:https://example.com/id', '//evil.com/path',
  '\\evil.com/path', '/\\evil.com/path', '/%5cevil.com/', '/%2f%2fevil.com/',
  '/%252f%252fevil.com/%00', 'https:\\example.com/', 'https:/example.com/', 'https:example.com',
  'https://user:password@example.com/', 'https://example.com@evil.com/',
  'https://localhost/', 'https://localhost./', 'https://intranet/', 'https://host.local/',
  'https://host.localhost/', 'https://host.internal/', 'https://host.lan/', 'https://host.home/',
  'https://host.localdomain/', 'https://host.test/', 'https://host.invalid/',
  'https://host.intranet/', 'https://host.corp/', 'https://host.private/',
  'https://router.home.arpa/', 'https://hidden.onion/',
  'https://127.0.0.1/', 'https://127.1/', 'https://0x7f000001/', 'https://2130706433/',
  'https://10.1.2.3/', 'https://192.168.1.1/', 'https://169.254.169.254/', 'https://8.8.8.8/',
  'https://[::1]/', 'https://[2001:4860:4860::8888]/', 'https://example.com\\@evil.com/',
  'https://example.com/"onclick="alert(1)', 'https://example.com/<script>',
  "https://example.com/'onmouseover='alert(1)", 'https://example.com/`payload',
  'https://example.com/\u0000', 'https://example.com/\npath', 'https://example.com/%0aevil',
  'https://example.com/%00', 'https://example.com/%5cevil', 'https://example.com/%GG',
  ' https://example.com/', 'https://example.com/path with spaces', '/article\u0001/',
  '/%0a/evil/', '/%22onclick=evil/', 'articles/story/', '../articles/story/', '#section', '',
]) {
  test(`unsafe or unsupported destination falls back literally: ${JSON.stringify(href)}`, () => {
    assert.equal(safeInlineDestination(href), undefined);
    const text = `Before [Σύνδεσμος](${href}) after.`;
    assert.deepEqual(parseInlineLinks(text), plain(text));
  });
}

test('malformed or unsupported Markdown stays literal', () => {
  for (const text of [
    '[Missing](https://example.com', '[Missing link', '[Label] (https://example.com)',
    '[](https://example.com/)', '[   ](https://example.com/)', '[Label]()',
    '[Label]( https://example.com/)', '[Label](https://example.com/ "Title")',
    '[outer [inner](https://example.com/)]', '[Line\nbreak](https://example.com/)',
    '![Image](https://example.com/image.jpg)', '\\[literal](https://example.com/)',
    '[Label](https://example.com/unbalanced(paren)',
  ]) assert.deepEqual(parseInlineLinks(text), plain(text));
});

test('an unsafe link does not swallow later valid links or surrounding copy', () => {
  assert.deepEqual(parseInlineLinks('Before [bad](javascript:alert(1)) then [good](https://example.com/) after.'), [
    ...plain('Before [bad](javascript:alert(1)) then '), link('good', 'https://example.com/'), ...plain(' after.'),
  ]);
});

test('large malformed input is preserved without nested-regex backtracking', () => {
  const text = '['.repeat(50_000) + 'broken](' + '('.repeat(50_000);
  assert.deepEqual(parseInlineLinks(text), plain(text));
});

test('reading time counts visible labels, without inflating it with URL words', () => {
  for (const lang of ['en', 'el']) {
    const copy = `${(lang === 'el' ? 'λέξη ' : 'word ').repeat(185)}Obscurus Rex`;
    const linkedCopy = copy.replace('Obscurus Rex', `[Obscurus Rex](https://example.com/${'long-url-path/'.repeat(40)})`);
    const metadata = { title: { en: 'Title', el: 'Τίτλος' }, dek: { en: 'Brief summary', el: 'Μικρή περίληψη' } };
    for (const structured of [true, false]) {
      const article = (text) => structured
        ? { ...metadata, sections: [{ type: 'paragraph', text: { [lang]: text } }] }
        : { ...metadata, body: { [lang]: [text] } };
      assert.equal(readingTime(article(copy), lang), lang === 'el' ? '1 λεπτό ανάγνωσης' : '1 min read');
      assert.equal(readingTime(article(linkedCopy), lang), readingTime(article(copy), lang));
    }
  }
});

test('the actual Astro component escapes HTML and attributes without executing article markup', async () => {
  // Build an isolated fixture project, never a route in the publication itself.
  const root = await mkdtemp(resolve('node_modules/.inline-links-test-'));
  const samples = [
    '<script>globalThis.__xss=1</script><img src=x onerror="globalThis.__xss=1"><svg onload="globalThis.__xss=1"></svg>',
    '[<img src=x onerror="alert(1)"> & <script>alert(1)</script>](https://example.com/?a=1&b=2)',
    '[Unsafe](javascript:alert(1)) [Bad](https://example.com/"onclick="alert(1)) [Malformed](https://example.com',
    'Οι [Obscurus Rex](https://obscurusrex.com/) και οι [The Prisoners](/el/articles/story/).',
  ];
  try {
    for (const dir of ['components', 'lib', 'pages']) await mkdir(`${root}/src/${dir}`, { recursive: true });
    await copyFile('src/components/InlineLinks.astro', `${root}/src/components/InlineLinks.astro`);
    await copyFile('src/lib/inline-links.ts', `${root}/src/lib/inline-links.ts`);
    await writeFile(`${root}/src/pages/index.astro`, `---\nimport InlineLinks from '../components/InlineLinks.astro';\nconst samples = ${JSON.stringify(samples)};\n---\n<html lang="el"><head><title>Escaping regression</title></head><body>{samples.map((text, index) => <p data-case={index}><InlineLinks text={text} lang="el" /></p>)}</body></html>`);
    await build({ root: pathToFileURL(`${root}/`), configFile: false, logLevel: 'silent' });
    const html = await readFile(`${root}/dist/index.html`, 'utf8');
    assert.ok(!/<(?:script|img|svg)\b/i.test(html), 'Payloads must not become HTML elements');
    assert.ok(html.includes('&lt;script&gt;globalThis.__xss=1&lt;/script&gt;'));
    assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'), 'Attribute values are escaped');
    const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.equal(anchors.length, 3, 'Only supported safe links render');
    assert.ok(anchors.every(([, attributes]) => !/\son\w+=/i.test(attributes)), 'No injected attributes');
    assert.match(anchors[0][1], /target="_blank" rel="noopener noreferrer"/);
    assert.ok(anchors[0][2].includes('&lt;img'));
    assert.ok(anchors[1][2].includes('ανοίγει σε νέα καρτέλα'));
    assert.match(anchors[2][1], /href="\/el\/articles\/story\/"/);
    assert.ok(!/\btarget=/.test(anchors[2][1]));
    assert.ok(html.includes('[Unsafe](javascript:alert(1))'), 'Rejected syntax stays literal');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
