export type InlineSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string; external: boolean };

type Destination = { href: string; external: boolean };

const unsafeUrlCharacters = /[\s\u0000-\u001f\u007f-\u009f<>"'`\\]/u;
const unsafeDecodedPath = /[\u0000-\u001f\u007f-\u009f<>"'`\\]/u;
const encodedUnsafeCharacters = /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i;
const domainLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const localSuffixes = new Set(['localhost', 'local', 'localdomain', 'internal', 'intranet', 'lan', 'home', 'corp', 'private', 'arpa', 'onion', 'test', 'invalid', 'example']);

/** Deliberately accept public HTTPS domain names and unambiguous root-relative paths only. */
export function safeInlineDestination(value: string): Destination | undefined {
  if (!value || unsafeUrlCharacters.test(value) || encodedUnsafeCharacters.test(value) || /%(?![a-f0-9]{2})/i.test(value)) return;

  try {
    if (value.startsWith('/') && !value.startsWith('//')) {
      const path = decodeURIComponent(value.split(/[?#]/, 1)[0]);
      if (path.startsWith('//') || unsafeDecodedPath.test(path)) return;
      return { href: value, external: false };
    }

    if (!/^https:\/\//i.test(value)) return;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return;
    const hostname = url.hostname.replace(/\.$/, '');
    const labels = hostname.split('.');
    const suffix = labels.at(-1)!;
    // Reject IP literals (including URL-normalized numeric/hex forms), single-label and local hosts.
    if (hostname.length > 253 || labels.length < 2 || labels.some((label) => !domainLabel.test(label)) ||
        !/^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(suffix) || localSuffixes.has(suffix)) return;
    return { href: url.href, external: true };
  } catch {
    return;
  }
}

/** A small inline-link grammar, not an HTML or full Markdown renderer. Invalid input stays literal. */
export function parseInlineLinks(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let plainStart = 0;

  for (let start = 0; start < text.length; start++) {
    if (text[start] !== '[') continue;
    const labelEnd = text.indexOf(']', start + 1);
    if (labelEnd === -1) break;
    if (text[labelEnd + 1] !== '(') {
      start = labelEnd;
      continue;
    }

    // Balanced parentheses allow URLs such as /wiki/Title_(detail).
    let end = labelEnd + 2;
    let depth = 1;
    for (; end < text.length; end++) {
      if (text[end] === '(') depth++;
      if (text[end] === ')' && --depth === 0) break;
    }
    if (depth !== 0) break;

    const label = text.slice(start + 1, labelEnd);
    const destination = safeInlineDestination(text.slice(labelEnd + 2, end));
    const supportedLabel = label.trim() && !/[\[\]\r\n\\]/.test(label);
    // Images, escaped delimiters and nested labels remain plain text.
    if (supportedLabel && text[start - 1] !== '!' && text[start - 1] !== '\\' && destination) {
      if (start > plainStart) segments.push({ type: 'text', text: text.slice(plainStart, start) });
      segments.push({ type: 'link', text: label, ...destination });
      plainStart = end + 1;
    }
    start = end;
  }

  if (plainStart < text.length || segments.length === 0) segments.push({ type: 'text', text: text.slice(plainStart) });
  return segments;
}
