import type { Article, LanguageCode } from '../content/editorial';

export function formatPublicationDate(date: string, lang: LanguageCode, month: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'Europe/Athens',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function readingTime(article: Article, lang: LanguageCode) {
  const paragraphs = article.sections?.length
    ? article.sections.filter((section) => section.type !== 'link').map((section) => section.text[lang])
    : article.body?.[lang] ?? [];
  const text = [article.title[lang], article.dek[lang], ...paragraphs].join(' ');
  const words = Array.from(new Intl.Segmenter(lang, { granularity: 'word' }).segment(text))
    .filter((segment) => segment.isWordLike).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return lang === 'el'
    ? `${minutes} ${minutes === 1 ? 'λεπτό' : 'λεπτά'} ανάγνωσης`
    : `${minutes} min read`;
}
