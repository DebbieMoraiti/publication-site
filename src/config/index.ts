import { validatePublicationContent } from '../content/validate-publication';
import modules from './modules.json';
import site from './site.json';
import theme from './theme.json';
import artist from '../content/artist.json';

type LocalizedText = { en?: string; el?: string };
type ArtistContent = {
  identity?: { name?: string; eyebrow?: LocalizedText; tagline?: LocalizedText };
  contact?: { email?: string };
  socials?: { platform?: string; url?: string; verifiedPublic?: boolean }[];
};
const editable = artist as ArtistContent;

// CMS saves can omit blank fields. Normalize editorial data here, while keeping
// domain, languages, SEO, developer credit and form settings in site.json.
validatePublicationContent();

export const siteConfig = {
  ...site,
  seo: {
    ...site.seo,
    siteUrl: import.meta.env.PUBLIC_SITE_URL?.trim() || site.seo.siteUrl,
  },
  identity: {
    name: editable.identity?.name?.trim() || 'Artist Name',
    eyebrow: {
      en: editable.identity?.eyebrow?.en ?? '',
      el: editable.identity?.eyebrow?.el ?? '',
    },
    tagline: {
      en: editable.identity?.tagline?.en ?? '',
      el: editable.identity?.tagline?.el ?? '',
    },
  },
  contact: {
    ...site.contact,
    email: editable.contact?.email ?? '',
  },
  socials: (editable.socials ?? []).map(({ platform, url, verifiedPublic }) => ({
    platform: platform ?? '',
    url: url ?? '',
    verifiedPublic: verifiedPublic === true,
  })),
};
export const themeConfig = theme;

export const moduleConfig = {
  ...modules,
  sections: [...modules.sections].sort((first, second) => first.order - second.order),
};

const supportedSections = new Set([
  'hero', 'about', 'projects', 'discography', 'media', 'live', 'services', 'contact', 'pressKit',
]);
if (
  moduleConfig.sections.some((section) => !supportedSections.has(section.id)) ||
  new Set(moduleConfig.sections.map((section) => section.id)).size !== moduleConfig.sections.length
) {
  throw new Error('modules.json contains an unknown or duplicate section id.');
}

export const enabledSections = moduleConfig.sections.filter(
  (section) => section.enabled,
);
