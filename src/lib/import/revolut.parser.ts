import type { ImportRowType, NormalizedImportRow, ParsedImportGroup } from './types';
import { parseImportAmount } from './parse-import-amount';

const REVOLUT_HEADER_ALIASES: Record<string, string> = {
  type: 'type',
  tipo: 'type',
  product: 'product',
  prodotto: 'product',
  'started date': 'startedDate',
  'data di inizio': 'startedDate',
  'completed date': 'completedDate',
  'data di completamento': 'completedDate',
  description: 'description',
  descrizione: 'description',
  amount: 'amount',
  importo: 'amount',
  fee: 'fee',
  costo: 'fee',
  currency: 'currency',
  valuta: 'currency',
  state: 'state',
  balance: 'balance',
  saldo: 'balance',
};

const COMPLETED_STATES = new Set(['completed', 'completato']);
const PENDING_STATES = new Set(['pending', 'in sospeso']);
const REVERTED_STATES = new Set(['reverted', 'operazione annullata', 'declined', 'failed']);

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function mapHeaders(headerRow: string[]): Record<string, number> | null {
  const mapped: Record<string, number> = {};
  headerRow.forEach((cell, index) => {
    const key = REVOLUT_HEADER_ALIASES[normalizeHeader(cell)];
    if (key) mapped[key] = index;
  });

  const required = [
    'type',
    'product',
    'startedDate',
    'completedDate',
    'description',
    'amount',
    'currency',
    'state',
  ] as const;
  if (!required.every((key) => key in mapped)) return null;
  return mapped;
}

function getHeaderIndex(headers: Record<string, number>, key: string): number {
  const index = headers[key];
  if (index === undefined) {
    throw new Error(`Missing Revolut column: ${key}`);
  }
  return index;
}

function parseRevolutDate(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function parseDecimalAmount(value: string | undefined): number | null {
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

export function parseRevolutRows(rows: string[][]): ParsedImportGroup[] {
  const headerIndex = rows.findIndex((row) => mapHeaders(row) !== null);
  if (headerIndex < 0) {
    throw new Error('Revolut header row not found');
  }

  const headers = mapHeaders(rows[headerIndex]!)!;
  const groups = new Map<string, ParsedImportGroup>();

  for (const row of rows.slice(headerIndex + 1)) {
    if (!row.some((cell) => String(cell ?? '').trim())) continue;

    const product =
      collapseDescription(String(row[getHeaderIndex(headers, 'product')] ?? 'Attuale')) ||
      'Attuale';
    const state = String(row[getHeaderIndex(headers, 'state')] ?? '')
      .trim()
      .toLowerCase();
    const currency = String(row[getHeaderIndex(headers, 'currency')] ?? 'EUR')
      .trim()
      .toUpperCase();
    const description = collapseDescription(
      String(row[getHeaderIndex(headers, 'description')] ?? '')
    );
    const signedAmount = parseDecimalAmount(String(row[getHeaderIndex(headers, 'amount')] ?? ''));
    const feeIndex = headers.fee;
    const fee =
      feeIndex === undefined ? 0 : (parseDecimalAmount(String(row[feeIndex] ?? '0')) ?? 0);
    const completedDate = parseRevolutDate(
      String(row[getHeaderIndex(headers, 'completedDate')] ?? '')
    );
    const startedDate = parseRevolutDate(String(row[getHeaderIndex(headers, 'startedDate')] ?? ''));
    const date = completedDate ?? startedDate;

    if (!description || signedAmount === null || !date) continue;

    if (!groups.has(product)) {
      groups.set(product, {
        format: 'revolut',
        productKey: product,
        productLabel: product,
        rows: [],
        excludedCount: 0,
      });
    }
    const group = groups.get(product)!;

    if (REVERTED_STATES.has(state)) {
      group.excludedCount += 1;
      continue;
    }

    if (PENDING_STATES.has(state)) {
      group.excludedCount += 1;
      continue;
    }

    if (!COMPLETED_STATES.has(state)) {
      group.excludedCount += 1;
      continue;
    }

    if (currency !== 'EUR') {
      group.excludedCount += 1;
      continue;
    }

    const type: ImportRowType = signedAmount >= 0 ? 'income' : 'expense';
    let amount = Math.abs(signedAmount);
    if (type === 'expense' && fee > 0) {
      amount += fee;
    }

    amount = Number(amount.toFixed(2));
    if (amount <= 0) {
      group.excludedCount += 1;
      continue;
    }

    const normalized: NormalizedImportRow = {
      rowId: createRowId(),
      date,
      description,
      amount,
      type,
      currency,
      rawSource: {
        bank: 'revolut',
        product,
        state,
      },
    };

    group.rows.push(normalized);
  }

  return Array.from(groups.values()).filter(
    (group) => group.rows.length > 0 || group.excludedCount > 0
  );
}
