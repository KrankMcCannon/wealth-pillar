import type { ParseImportFileResult } from './types';
import { parseImportRows } from './import-templates';

function sheetToRows(matrix: unknown[][]): string[][] {
  return matrix.map((row) => row.map((cell) => String(cell ?? '')));
}

function isZipWorkbook(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export async function readSpreadsheetRows(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const workbook = isZipWorkbook(bytes)
    ? XLSX.read(buffer, {
        type: 'array',
        raw: false,
        cellDates: false,
      })
    : XLSX.read(new TextDecoder('utf-8').decode(bytes), {
        type: 'string',
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
  return parseImportRows(rows, { fileName: file.name });
}

export { detectFormatFromRows, parseImportRows } from './import-templates';
export { parseRevolutRows } from './revolut.parser';
export { parseCredemRows } from './credem.parser';
export { parseHouseholdRows } from './household.parser';
export { parseYearFromFileName, resolveImportYear } from './import-row-utils';
export * from './import-hash';
export * from './types';
export * from './category-suggestions';
export * from './internal-transfer';
