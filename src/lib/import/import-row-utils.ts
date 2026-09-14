const HEADER_SCAN_LIMIT = 30;

export function normalizeHeaderCell(
  value: unknown,
  options?: { stripColon?: boolean }
): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return options?.stripColon === false ? normalized : normalized.replace(/:$/, '');
}

export function collapseDescription(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function createRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function rowsMatchHeaderSignatures(
  rows: string[][],
  signatures: readonly (readonly string[])[]
): boolean {
  for (const row of rows.slice(0, HEADER_SCAN_LIMIT)) {
    const cells = row.map((cell) => normalizeHeaderCell(cell)).filter(Boolean);
    if (cells.length < 4) continue;
    const joined = cells.join('|');
    if (signatures.some((signature) => signature.every((part) => joined.includes(part)))) {
      return true;
    }
  }
  return false;
}

export function parseYearFromFileName(fileName: string): number | null {
  const match = fileName.match(/\d{4}/);
  if (!match) return null;
  const year = Number.parseInt(match[0], 10);
  if (year < 1900 || year > 2100) return null;
  return year;
}

export function resolveImportYear(fileName: string, now: Date = new Date()): number {
  return parseYearFromFileName(fileName) ?? now.getFullYear();
}
