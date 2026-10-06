import { siteConfig } from '../config';

export type LanguageCode = 'en' | 'el';

const supported = ['en', 'el'] as const;
const { defaultLanguage, languages } = siteConfig.localization;
const configuredBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/g, '');
const basePath = configuredBase === '' || configuredBase === '/' ? '' : `/${configuredBase.replace(/^\/+|\/+$/g, '')}`;

if (
  !supported.includes(defaultLanguage as LanguageCode) ||
  languages.length !== supported.length ||
  supported.some((code) => !languages.some((language) => language.code === code))
) {
  throw new Error('site.json must declare exactly en and el, and use one as the defaultLanguage.');
}

export const secondaryLanguages = languages.filter(
  (language) => language.code !== defaultLanguage,
) as { code: LanguageCode; label: string }[];

export function assetPath(pathname: string): string {
  return withBase(pathname);
}

function withBase(pathname: string): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    throw new Error('Site paths must be root-relative.');
  }
  if (!basePath) return pathname;
  if (pathname === basePath || pathname.startsWith(`${basePath}/`)) return pathname;
  return `${basePath}${pathname}`;
}

export function languagePath(lang: LanguageCode, page = ''): string {
  const suffix = page.replace(/^\/+|\/+$/g, '');
  const prefix = lang === defaultLanguage ? '/' : `/${lang}/`;
  return withBase(suffix ? `${prefix}${suffix}/` : prefix);
}

export function pageFromPath(pathname: string): string {
  let stripped = pathname;
  if (basePath && (stripped === basePath || stripped.startsWith(`${basePath}/`))) {
    stripped = stripped.slice(basePath.length) || '/';
  }
  const clean = stripped.replace(/^\/+|\/+$/g, '');
  const [first, ...rest] = clean.split('/');
  return supported.includes(first as LanguageCode) && first !== defaultLanguage
    ? rest.join('/')
    : clean;
}

export function absoluteUrl(pathname: string): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    throw new Error('Site URLs must be root-relative paths.');
  }
  const origin = siteConfig.seo.siteUrl.trim();
  if (!origin || !/^https:\/\//.test(origin)) {
    throw new Error('Set seo.siteUrl to the final HTTPS domain in site.json.');
  }
  const base = new URL(origin);
  if (base.pathname !== '/' || base.search || base.hash) {
    throw new Error('seo.siteUrl must contain only the HTTPS origin, without a path.');
  }
  return new URL(withBase(pathname).replace(/^\//, ''), base).href;
}

export function alternates(page = '') {
  return languages.map((language) => ({
    lang: language.code as LanguageCode,
    url: absoluteUrl(languagePath(language.code as LanguageCode, page)),
  }));
}
