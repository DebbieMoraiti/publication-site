export function safeLink(value?: string): string {
  const url = value?.trim() ?? '';
  if (/[\\\u0000-\u001f\u007f]/.test(url)) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : '';
  } catch {
    return '';
  }
}

export function safeEmail(value?: string): string {
  const email = value?.trim() ?? '';
  return /^[a-z0-9.!$'*+=^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email) ? email : '';
}

export function safeEmbed(value?: string): string {
  const url = safeLink(value);
  if (!url.startsWith('https://')) return '';
  const parsed = new URL(url);
  if (
    (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'www.youtube-nocookie.com') &&
    /^\/embed\/[a-zA-Z0-9_-]{11}$/.test(parsed.pathname)
  ) {
    return `https://www.youtube-nocookie.com${parsed.pathname}`;
  }
  if (parsed.hostname === 'player.vimeo.com' && /^\/video\/[0-9]+$/.test(parsed.pathname)) {
    return `https://player.vimeo.com${parsed.pathname}`;
  }
  return '';
}
