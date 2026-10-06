import { enabledSections, siteConfig } from '../config';
import live from '../content/live.json';
import { safeLink } from '../content/links';
import { absoluteUrl, languagePath, type LanguageCode } from '../i18n/routes';
import { organizeEvents, todayInZone, type LiveEvent } from '../live/events';

type Localized = { en?: string; el?: string };
type VerifiedUrl = { url?: string; verifiedPublic?: boolean };
type Source = { type?: 'CreativeWork' | 'Article' | 'WebPage'; name?: string; url?: string; datePublished?: string };
type Member = { name?: string; roles?: string[]; startDate?: string; endDate?: string; sameAs?: VerifiedUrl[] };
type EventDetails = {
  id?: string;
  description?: Localized;
  url?: string;
  endDate?: string;
  offers?: { price?: number | string; priceCurrency?: string; availability?: string };
};
type Release = {
  id?: string;
  type?: 'album' | 'recording';
  name?: Localized;
  url?: string;
  image?: string;
  datePublished?: string;
  genres?: string[];
  releaseType?: 'album' | 'ep' | 'single' | 'broadcast';
  isrcCode?: string;
  duration?: string;
};
type SchemaSettings = {
  enabled?: boolean;
  entityType?: 'Person' | 'MusicGroup';
  entityId?: string;
  alternateName?: string;
  description?: Localized;
  image?: string;
  jobTitles?: string[];
  genres?: string[];
  location?: { name?: string };
  founding?: { date?: string; location?: string };
  sameAs?: VerifiedUrl[];
  subjectOf?: Source[];
  members?: Member[];
  knowsAbout?: string[];
  includeLiveEvents?: boolean;
  eventDetails?: EventDetails[];
  discography?: Release[];
};

const settings = siteConfig.schema as SchemaSettings;
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const strings = (values: unknown) =>
  Array.isArray(values) ? values.map(clean).filter(Boolean) : [];
const sectionEnabled = (id: string) => enabledSections.some((section) => section.id === id);

// Only approved HTTPS URLs or root-relative client assets may enter JSON-LD.
function safeUrl(value: unknown, allowLocal = false): string | undefined {
  const input = clean(value);
  const approved = safeLink(input);
  if (!approved || (!approved.startsWith('https://') && !allowLocal)) return;
  try {
    const url = new URL(approved, absoluteUrl('/'));
    if (url.protocol !== 'https:' || url.username || url.password) return;
    return url.href;
  } catch {
    return;
  }
}

function verifiedUrls(values: VerifiedUrl[] = []): string[] {
  return [...new Set(values.filter((item) => item?.verifiedPublic === true)
    .map((item) => safeUrl(item.url)).filter((url): url is string => Boolean(url)))];
}

function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value === '' || value == null ? undefined : value;
}

function entityId(type: 'Person' | 'MusicGroup'): string {
  const fallback = `${absoluteUrl('/')}#${type === 'Person' ? 'person' : 'musicgroup'}`;
  const custom = safeUrl(settings.entityId);
  if (!custom) return fallback;
  if (new URL(custom).origin !== new URL(fallback).origin) {
    throw new Error('schema.entityId must use the configured site origin.');
  }
  return custom;
}

function uniqueId(id: unknown, category: string, used: Set<string>): string {
  const value = clean(id);
  if (!/^[a-z0-9-]+$/.test(value) || used.has(value)) {
    throw new Error(`Invalid or duplicate schema ${category} id: ${value}`);
  }
  used.add(value);
  return value;
}

const releaseTypes: Record<string, string> = {
  album: 'https://schema.org/AlbumRelease',
  ep: 'https://schema.org/EPRelease',
  single: 'https://schema.org/SingleRelease',
  broadcast: 'https://schema.org/BroadcastRelease',
};

export function buildStructuredData(
  lang: LanguageCode,
  page: string,
  pageTitle: string,
  pageDescription: string,
): Record<string, unknown> | undefined {
  // The private image-framing utility is never an artist page.
  if (!settings.enabled || (page !== '' && page !== 'live')) return;
  if (settings.entityType !== 'Person' && settings.entityType !== 'MusicGroup') {
    throw new Error('schema.entityType must be Person or MusicGroup.');
  }

  const origin = absoluteUrl('/');
  const canonical = absoluteUrl(languagePath(lang, page));
  const id = entityId(settings.entityType);
  const name = clean(siteConfig.identity.name);
  if (!name) return;
  const image = safeUrl(settings.image || siteConfig.seo.shareImage || '/social-share.png', true);
  const sameAs = [...new Set([
    ...verifiedUrls(siteConfig.socials),
    ...verifiedUrls(settings.sameAs),
  ])];
  const entity = compact({
    '@type': settings.entityType,
    '@id': id,
    name,
    alternateName: clean(settings.alternateName),
    description: clean(settings.description?.[lang]) || siteConfig.seo.description[lang],
    url: origin,
    image,
    sameAs,
    jobTitle: settings.entityType === 'Person' ? strings(settings.jobTitles) : undefined,
    genre: strings(settings.genres),
    homeLocation: settings.entityType === 'Person' && clean(settings.location?.name)
      ? { '@type': 'Place', name: clean(settings.location?.name) } : undefined,
    foundingDate: settings.entityType === 'MusicGroup' ? clean(settings.founding?.date) : undefined,
    foundingLocation: settings.entityType === 'MusicGroup' && clean(settings.founding?.location)
      ? { '@type': 'Place', name: clean(settings.founding?.location) } : undefined,
    knowsAbout: settings.entityType === 'Person' ? strings(settings.knowsAbout) : undefined,
    member: settings.entityType === 'MusicGroup'
      ? (settings.members ?? []).filter((member) => clean(member.name)).map((member) => ({
          '@type': 'OrganizationRole',
          roleName: strings(member.roles),
          startDate: clean(member.startDate),
          endDate: clean(member.endDate),
          member: { '@type': 'Person', name: clean(member.name), sameAs: verifiedUrls(member.sameAs) },
        })) : undefined,
    subjectOf: (settings.subjectOf ?? []).filter((source) => safeUrl(source.url))
      .map((source) => ({
        '@type': ['Article', 'WebPage'].includes(source.type ?? '') ? source.type : 'CreativeWork',
        name: clean(source.name),
        url: safeUrl(source.url),
        datePublished: clean(source.datePublished),
      })),
  });
  const website = compact({
    '@type': 'WebSite', '@id': `${origin}#website`, name, url: origin,
    description: siteConfig.seo.description[siteConfig.localization.defaultLanguage as LanguageCode],
    inLanguage: siteConfig.localization.languages.map((language) => language.code),
    about: { '@id': id },
  });
  const webPage = compact({
    '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical,
    name: pageTitle, description: pageDescription, inLanguage: lang,
    isPartOf: { '@id': `${origin}#website` }, about: { '@id': id },
  });

  const events: unknown[] = [];
  if (settings.includeLiveEvents && sectionEnabled('live')) {
    const { upcoming, past } = organizeEvents(live.items as LiveEvent[], todayInZone(siteConfig.localization.timeZone));
    const details = new Map((settings.eventDetails ?? []).map((item) => [item.id, item]));
    for (const event of page === 'live' ? [...upcoming, ...past] : upcoming) {
      const extra = details.get(event.id);
      const ticket = safeUrl(event.ticketUrl?.[lang], true);
      events.push(compact({
        '@type': 'MusicEvent', '@id': `${origin}#event-${event.id}`,
        name: event.title[lang], description: clean(extra?.description?.[lang]),
        startDate: event.date, endDate: clean(extra?.endDate),
        url: safeUrl(extra?.url) || ticket,
        image: safeUrl(event.poster, true),
        inLanguage: lang,
        performer: { '@id': id },
        location: event.venue || event.city
          ? { '@type': 'Place', name: clean(event.venue), address: event.city
            ? { '@type': 'PostalAddress', addressLocality: clean(event.city) } : undefined }
          : undefined,
        offers: ticket ? {
          '@type': 'Offer', url: ticket, price: extra?.offers?.price,
          priceCurrency: clean(extra?.offers?.priceCurrency),
          availability: safeUrl(extra?.offers?.availability),
        } : undefined,
      }));
    }
  }

  const releases: unknown[] = [];
  if (page === '' && sectionEnabled('discography')) {
    const used = new Set<string>();
    for (const release of settings.discography ?? []) {
      const releaseId = uniqueId(release.id, 'discography', used);
      if (release.type !== 'album' && release.type !== 'recording') {
        throw new Error(`Invalid schema discography type: ${releaseId}`);
      }
      if (!clean(release.name?.[lang])) continue;
      releases.push(compact({
        '@type': release.type === 'album' ? 'MusicAlbum' : 'MusicRecording',
        '@id': `${origin}#release-${releaseId}`,
        name: clean(release.name?.[lang]),
        url: safeUrl(release.url),
        image: safeUrl(release.image, true),
        datePublished: clean(release.datePublished),
        genre: strings(release.genres),
        byArtist: { '@id': id },
        albumReleaseType: release.type === 'album' && release.releaseType
          ? releaseTypes[release.releaseType] : undefined,
        isrcCode: release.type === 'recording' ? clean(release.isrcCode) : undefined,
        duration: clean(release.duration),
      }));
    }
  }

  return compact({ '@context': 'https://schema.org', '@graph': [entity, website, webPage, ...events, ...releases] }) as Record<string, unknown>;
}
