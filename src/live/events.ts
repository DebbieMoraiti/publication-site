export interface LiveEvent {
  id: string;
  date: string;
  title: { en: string; el: string };
  venue?: string;
  city?: string;
  poster?: string;
  posterAlt?: { en: string; el: string };
  ticketUrl?: { en: string; el: string };
}

export function todayInZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function organizeEvents(events: LiveEvent[], today: string) {
  const ids = new Set<string>();
  for (const event of events) {
    if (!validDate(event.date) || !/^[a-z0-9-]+$/.test(event.id) || ids.has(event.id) ||
        !event.title?.en?.trim() || !event.title?.el?.trim()) {
      throw new Error(`Invalid or duplicate live event: ${event.id}`);
    }
    ids.add(event.id);
  }
  return {
    upcoming: events.filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    past: events.filter((event) => event.date < today).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
  };
}

export function displayDate(date: string, lang: 'en' | 'el'): string {
  return new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
