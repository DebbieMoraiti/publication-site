import type { Article, LanguageCode } from '../content/editorial';
import { parseInlineLinks } from './inline-links.ts';

export function formatPublicationDate(date: string, lang: LanguageCode, month: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'Europe/Athens',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function readingTime(article: Article, lang: LanguageCode) {
  const visible = (text: string) => parseInlineLinks(text).map((part) => part.text).join('');
  const paragraphs = article.sections?.length
    ? article.sections.filter((section) => section.type !== 'link').map((section) => section.type === 'paragraph' ? visible(section.text[lang]) : section.text[lang])
    : (article.body?.[lang] ?? []).map(visible);
  const text = [article.title[lang], article.dek[lang], ...paragraphs].join(' ');
  const words = Array.from(new Intl.Segmenter(lang, { granularity: 'word' }).segment(text))
    .filter((segment) => segment.isWordLike).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return lang === 'el'
    ? `${minutes}′ ανάγνωσης`
    : `${minutes} min read`;
}
