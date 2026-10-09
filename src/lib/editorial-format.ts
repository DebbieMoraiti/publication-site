import type { LanguageCode } from '../content/editorial';

export function formatPublicationDate(date: string, lang: LanguageCode) {
  return new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Athens',
  }).format(new Date(`${date}T12:00:00Z`));
}
