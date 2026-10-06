import { validatePublicationContent } from '../content/validate-publication';
import publication from '../content/publication.json';
import site from './site.json';
import theme from './theme.json';

validatePublicationContent();

export const siteConfig = {
  ...site,
  seo: {
    ...site.seo,
    siteUrl: import.meta.env.PUBLIC_SITE_URL?.trim() || site.seo.siteUrl,
  },
  identity: {
    name: publication.identity.name.trim() || 'Working Title',
    tagline: publication.identity.tagline,
  },
};

export const themeConfig = theme;
