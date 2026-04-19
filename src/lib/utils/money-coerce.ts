/**
 * Coerce amounts from DB (Drizzle `numeric` → string), forms, or loose types to a finite number.
 */

export function toFiniteMoney(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return 0;
    // Simple "123,45" (decimal comma only)
    if (/^\d+,\d+$/.test(t)) {
      const n = Number.parseFloat(t.replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    }
    // Italian "1.234,56"
    if (t.includes(',')) {
      const normalized = t.replace(/\./g, '').replace(',', '.');
      const n = Number.parseFloat(normalized);
      if (Number.isFinite(n)) return n;
    }
    const n = Number.parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
