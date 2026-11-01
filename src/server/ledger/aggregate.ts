import type { Transaction } from '@/lib/types';

/** Calculation rows only. Never use these as editable ledger entries. */
export type FinancialLedgerRow = Transaction & { transaction_count: number };

export function ledgerRowCount(rows: Transaction[]): number {
  return rows.reduce(
    (sum, row) => sum + ('transaction_count' in row ? Number(row.transaction_count) : 1),
    0
  );
}
