/** Safe formatters for Recharts ticks and screen-reader summaries (locale-aware). */

export function formatHistoryAxisDate(val: unknown): string {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (!s.includes('-')) return s;
  return s.split('-').slice(1).join('/');
}

export function formatBenchmarkAxisHead(val: unknown): string {
  const s = String(val ?? '').trim();
  if (!s) return '';
  return s.split(/\s+/)[0] ?? s;
}

export function formatLocaleMediumDate(isoLike: string | undefined, locale: string): string {
  if (!isoLike) return '';
  const head = isoLike.split(/\s+/)[0] ?? isoLike;
  const d = new Date(head);
  if (Number.isNaN(d.getTime())) return head;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}
