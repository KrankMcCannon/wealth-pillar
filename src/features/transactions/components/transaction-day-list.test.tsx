import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionDayList } from './transaction-day-list';
import type { Transaction } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('./grouped-transaction-card', () => ({
  GroupedTransactionCard: () => <div data-testid="grouped-card" />,
}));

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  description: 'Test',
  amount: 9.09,
  type: 'income',
  category: 'investments',
  date: '2026-09-01',
  user_id: 'u1',
  account_id: 'a1',
  created_at: '2026-09-01',
  updated_at: '2026-09-01',
  ...overrides,
});

describe('TransactionDayList', () => {
  it('prefixes a plus when the daily net is positive', () => {
    render(
      <TransactionDayList
        groupedTransactions={[
          { date: '2026-09-01', formattedDate: '1 set', transactions: [tx()], total: 9.09 },
        ]}
        categories={[]}
        onEditTransaction={vi.fn()}
      />
    );

    expect(screen.getByTestId('day-group-total')).toHaveTextContent('+9,09 €');
  });

  it('prefixes a minus when the daily net is negative', () => {
    render(
      <TransactionDayList
        groupedTransactions={[
          {
            date: '2026-08-30',
            formattedDate: '30 ago',
            transactions: [tx({ type: 'expense', amount: 10.19 })],
            total: -10.19,
          },
        ]}
        categories={[]}
        onEditTransaction={vi.fn()}
      />
    );

    expect(screen.getByTestId('day-group-total')).toHaveTextContent('−10,19 €');
  });
});
