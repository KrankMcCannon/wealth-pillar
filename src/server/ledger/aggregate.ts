import type { Transaction } from '@/lib/types';

/** Domain input shared by persisted entries and calculation-only aggregates. */
type LedgerCoordinates = Pick<
  Transaction,
  'date' | 'user_id' | 'account_id' | 'to_account_id' | 'type' | 'category'
>;
export type LedgerEntry = LedgerCoordinates & { amount: string | number } & Partial<
    Omit<Transaction, keyof LedgerCoordinates | 'amount'>
  >;
/** No synthetic identity or editable-row metadata exists on an aggregate. */
export type FinancialLedgerRow = LedgerEntry & { transaction_count: number };

export function ledgerRowCount(rows: LedgerEntry[]): number {
  return rows.reduce(
    (sum, row) => sum + ('transaction_count' in row ? Number(row.transaction_count) : 1),
    0
  );
}
