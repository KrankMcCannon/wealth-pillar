import type { ParsedImportGroup } from './types';
import { parseImportAmount } from './parse-import-amount';
import {
  collapseDescription,
  createRowId,
  normalizeHeaderCell,
} from './import-row-utils';

const HEADER_SCAN_LIMIT = 30;

const STRUCTURAL_ALIASES: Record<string, 'month' | 'day' | 'what' | 'categoria'> = {
  'colonna 1': 'month',
  month: 'month',
  mese: 'month',
  day: 'day',
  giorno: 'day',
  what: 'what',
  descrizione: 'what',
  categoria: 'categoria',
};

type HouseholdPayerColumn = {
  key: string;
  label: string;
  index: number;
};

type HouseholdLayout = {
  month: number;
  day: number;
  what: number;
  categoria?: number;
  payers: HouseholdPayerColumn[];
};

function findHouseholdLayout(headerRow: string[]): HouseholdLayout | null {
  const structural: Partial<Record<'month' | 'day' | 'what' | 'categoria', number>> = {};
  const payers: HouseholdPayerColumn[] = [];
  const usedKeys = new Set<string>();

  headerRow.forEach((cell, index) => {
    const raw = String(cell ?? '').trim();
    if (!raw) return;

    const normalized = normalizeHeaderCell(raw);
    const structuralKey = STRUCTURAL_ALIASES[normalized];
    if (structuralKey) {
      if (structural[structuralKey] === undefined) structural[structuralKey] = index;
      return;
    }

    let key = normalized || `column_${index}`;
    if (usedKeys.has(key)) key = `${key}_${index}`;
    usedKeys.add(key);
    payers.push({ key, label: raw, index });
  });

  if (
    structural.month === undefined ||
    structural.day === undefined ||
    structural.what === undefined ||
    structural.categoria === undefined ||
    payers.length === 0
  ) {
    return null;
  }

  return {
    month: structural.month,
    day: structural.day,
    what: structural.what,
    categoria: structural.categoria,
    payers,
  };
}

export function matchesHouseholdRows(rows: string[][]): boolean {
  return rows.slice(0, HEADER_SCAN_LIMIT).some((row) => findHouseholdLayout(row) !== null);
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildHouseholdIsoDate(
  year: number,
  month: number,
  day: number
): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeCategoryHint(value: string): string | undefined {
  const hint = collapseDescription(value).toLowerCase();
  return hint && hint !== 'totale' ? hint : undefined;
}

function emptyGroup(payer: HouseholdPayerColumn): ParsedImportGroup {
  return {
    format: 'household',
    productKey: payer.key,
    productLabel: payer.label,
    rows: [],
    excludedCount: 0,
  };
}

export function parseHouseholdRows(
  rows: string[][],
  options: { year: number }
): ParsedImportGroup[] {
  const headerIndex = rows.findIndex((row) => findHouseholdLayout(row) !== null);
  if (headerIndex < 0) {
    throw new Error('Household header row not found');
  }

  const layout = findHouseholdLayout(rows[headerIndex]!)!;
  const groups = new Map<string, ParsedImportGroup>(
    layout.payers.map((payer) => [payer.key, emptyGroup(payer)])
  );

  for (const row of rows.slice(headerIndex + 1)) {
    if (!row.some((cell) => String(cell ?? '').trim())) continue;

    const description = collapseDescription(String(row[layout.what] ?? ''));
    if (!description || description.toLowerCase() === 'totale') continue;

    const month = parsePositiveInt(String(row[layout.month] ?? ''));
    const day = parsePositiveInt(String(row[layout.day] ?? ''));
    if (month === null || day === null) continue;

    const date = buildHouseholdIsoDate(options.year, month, day);
    if (!date) continue;

    const categoryHint =
      layout.categoria === undefined
        ? undefined
        : normalizeCategoryHint(String(row[layout.categoria] ?? ''));

    for (const payer of layout.payers) {
      const amount = parseImportAmount(String(row[payer.index] ?? ''));
      if (amount === null || amount === 0) continue;

      const group = groups.get(payer.key)!;
      const absAmount = Number(Math.abs(amount).toFixed(2));
      if (absAmount <= 0) {
        group.excludedCount += 1;
        continue;
      }

      group.rows.push({
        rowId: createRowId(),
        date,
        description,
        amount: absAmount,
        type: amount < 0 ? 'income' : 'expense',
        currency: 'EUR',
        ...(categoryHint ? { categoryHint } : {}),
        rawSource: {
          bank: 'household',
          product: payer.label,
        },
      });
    }
  }

  return Array.from(groups.values()).filter((group) => group.rows.length > 0);
}
