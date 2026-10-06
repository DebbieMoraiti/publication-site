import type { LanguageCode } from './routes';
export type { LanguageCode } from './routes';

export const ui = {
  en: {
    skipToContent: 'Skip to content',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    languageLabel: 'Language',
    footerDescription: 'A reusable foundation for independent artist websites.',
    backToTop: 'Back to top',
  },
  el: {
    skipToContent: 'Μετάβαση στο περιεχόμενο',
    openMenu: 'Άνοιγμα πλοήγησης',
    closeMenu: 'Κλείσιμο πλοήγησης',
    languageLabel: 'Γλώσσα',
    footerDescription: 'Μια επαναχρησιμοποιήσιμη βάση για ιστοσελίδες καλλιτεχνών.',
    backToTop: 'Επιστροφή στην κορυφή',
  },
} satisfies Record<LanguageCode, Record<string, string>>;
