export function parseImportAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim().replace(/[^\d,.\-]/g, '');
  if (!trimmed || trimmed === '-') return null;

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
