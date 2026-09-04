import type { ImportRowType, ParsedImportGroup } from './types';
import { parseImportAmount } from './parse-import-amount';

const CREDEM_HEADERS = [
  'data contabile',
  'data valuta',
  'importo',
  'importo orig.',
  'divisa orig.',
  'canale',
  'categoria',
  'causale abi',
  'causale',
  'descrizione',
  'note',
] as const;

type CredemColumn = (typeof CREDEM_HEADERS)[number];

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/:$/, '');
}

function mapCredemHeaders(headerRow: string[]): Record<CredemColumn, number> | null {
  const mapped = {} as Record<CredemColumn, number>;
  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    if ((CREDEM_HEADERS as readonly string[]).includes(normalized)) {
      mapped[normalized as CredemColumn] = index;
    }
  });

  const required: CredemColumn[] = ['data contabile', 'importo', 'causale', 'descrizione'];
  if (!required.every((key) => key in mapped)) return null;
  return mapped;
}

function parseItalianDate(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function parseItalianAmount(value: string | undefined): number | null {
  return parseImportAmount(value);
}

function collapseDescription(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function createRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isProvisionalMovement(causaleAbi: string, description: string): boolean {
  return causaleAbi === '-' && description.endsWith('*');
}

export function parseCredemRows(rows: string[][]): ParsedImportGroup[] {
  const headerIndex = rows.findIndex((row) => mapCredemHeaders(row) !== null);
  if (headerIndex < 0) {
    throw new Error('Credem header row not found');
  }

  const headers = mapCredemHeaders(rows[headerIndex]!)!;
  const group: ParsedImportGroup = {
    format: 'credem',
    productKey: 'credem',
    productLabel: 'Credem',
    rows: [],
    excludedCount: 0,
  };

  for (const row of rows.slice(headerIndex + 1)) {
    if (!row.some((cell) => String(cell ?? '').trim())) continue;

    const date = parseItalianDate(String(row[headers['data contabile']] ?? ''));
    const signedAmount = parseItalianAmount(String(row[headers.importo] ?? ''));
    const description = collapseDescription(String(row[headers.descrizione] ?? ''));
    const causale = String(row[headers.causale] ?? '').trim();
    const causaleAbi = String(row[headers['causale abi']] ?? '').trim();
    const currency = String(row[headers['divisa orig.']] ?? 'EUR')
      .trim()
      .toUpperCase();

    if (!date || signedAmount === null || !description) continue;

    if (isProvisionalMovement(causaleAbi, description)) {
      group.excludedCount += 1;
      continue;
    }

    if (currency !== 'EUR') {
      group.excludedCount += 1;
      continue;
    }

    const type: ImportRowType = signedAmount >= 0 ? 'income' : 'expense';
    const amount = Number(Math.abs(signedAmount).toFixed(2));

    if (amount <= 0) {
      group.excludedCount += 1;
      continue;
    }

    group.rows.push({
      rowId: createRowId(),
      date,
      description,
      amount,
      type,
      currency,
      rawSource: {
        bank: 'credem',
        causale,
      },
    });
  }

  return group.rows.length > 0 || group.excludedCount > 0 ? [group] : [];
}
