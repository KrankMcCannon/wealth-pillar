import { expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { readSpreadsheetRows } from './index';

it('reads XLSX and CSV through the installed SheetJS adapter', async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['Date', 'Description', 'Amount'],
      ['2026-11-20', 'Groceries', '12.50'],
    ]),
    'Transactions'
  );
  const xlsxBytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const file = (name: string, bytes: Uint8Array) =>
    ({ name, arrayBuffer: async () => bytes.buffer.slice(0) }) as File;

  expect(await readSpreadsheetRows(file('transactions.xlsx', new Uint8Array(xlsxBytes)))).toEqual([
    ['Date', 'Description', 'Amount'],
    ['2026-11-20', 'Groceries', '12.50'],
  ]);
  expect(
    await readSpreadsheetRows(
      file(
        'transactions.csv',
        new TextEncoder().encode('Date,Description,Amount\n2026-11-20,Groceries,12.50')
      )
    )
  ).toEqual([
    ['Date', 'Description', 'Amount'],
    ['2026-11-20', 'Groceries', '12.50'],
  ]);
});
