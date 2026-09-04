import type { ParseImportFileResult } from './types';
import { detectFormatFromRows } from './detect-format';
import { parseCredemRows } from './credem.parser';
import { parseRevolutRows } from './revolut.parser';

function sheetToRows(matrix: unknown[][]): string[][] {
  return matrix.map((row) => row.map((cell) => String(cell ?? '')));
}

export async function readSpreadsheetRows(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false,
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet has no sheets');
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('Spreadsheet sheet is empty');
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  return sheetToRows(matrix);
}

export async function parseImportFile(file: File): Promise<ParseImportFileResult> {
  const rows = await readSpreadsheetRows(file);
  const format = detectFormatFromRows(rows);

  if (!format) {
    throw new Error('Unsupported bank statement format');
  }

  const groups = format === 'revolut' ? parseRevolutRows(rows) : parseCredemRows(rows);
  if (groups.length === 0) {
    throw new Error('No importable transactions found in file');
  }

  return { format, groups };
}

export { detectFormatFromRows } from './detect-format';
export { parseRevolutRows } from './revolut.parser';
export { parseCredemRows } from './credem.parser';
export * from './import-hash';
export * from './types';
export * from './category-suggestions';
export * from './internal-transfer';
