export function parseImportAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim().replace(/[€$\s]/g, '');

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const normalized = trimmed.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
