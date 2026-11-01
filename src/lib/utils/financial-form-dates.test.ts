import { expect, it } from 'vitest';
import { formatDateForInput } from '@/features/recurring/components/recurring-form-helpers';
import { mapTransactionToFormData } from '@/features/transactions/utils/transaction-form-data';
import { mapInvestmentToFormData } from '@/features/investments/utils/investment-form-data';
import type { Transaction } from '@/lib/types';
import type { investments } from '@/server/db/schema';

it.each([
  ['2026-05-31T22:30:00Z', '2026-06-01'],
  ['2026-10-31T23:30:00Z', '2026-11-01'],
  ['2025-12-31T23:30:00Z', '2026-01-01'],
])('preserves the same accounting day across financial forms for %s', (instant, day) => {
  expect(formatDateForInput(instant)).toBe(day);
  expect(formatDateForInput(new Date(instant))).toBe(day);
  expect(mapTransactionToFormData({ date: instant, type: 'expense' } as Transaction).date).toBe(
    day
  );
  expect(
    mapInvestmentToFormData({ created_at: new Date(instant) } as typeof investments.$inferSelect)
      .created_at
  ).toBe(day);
});
