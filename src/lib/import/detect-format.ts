import type { ImportBankFormat } from './types';

const REVOLUT_HEADER_SIGNATURES = [
  ['type', 'product', 'started date', 'completed date', 'description', 'amount'],
  ['tipo', 'prodotto', 'data di inizio', 'data di completamento', 'descrizione', 'importo'],
];

const CREDEM_HEADER_SIGNATURES = [['data contabile', 'data valuta', 'importo']];

function normalizeHeaderCell(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/:$/, '');
}

export function detectFormatFromRows(rows: string[][]): ImportBankFormat | null {
  for (const row of rows.slice(0, 30)) {
    const cells = row.map(normalizeHeaderCell).filter(Boolean);
    if (cells.length < 4) continue;

    const joined = cells.join('|');
    if (CREDEM_HEADER_SIGNATURES.some((sig) => sig.every((part) => joined.includes(part)))) {
      return 'credem';
    }
    if (REVOLUT_HEADER_SIGNATURES.some((sig) => sig.every((part) => joined.includes(part)))) {
      return 'revolut';
    }
  }

  return null;
}
