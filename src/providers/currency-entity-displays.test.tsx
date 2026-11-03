import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CurrencyProvider } from './currency-provider';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { AccountCard } from '@/features/accounts/components/account-card';
import { SeriesCard } from '@/features/recurring/components/series-card';
import { BudgetCategoryCard } from '@/features/budgets/components/budget-category-card';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en-US',
}));
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
const snapshot = {
  currency: 'USD' as const,
  rates: { USD: { base: 'EUR', quote: 'USD', date: '2026-11-02', rate: 1.2 } },
};
const transaction = {
  id: 'tx',
  description: 'Dinner',
  amount: 100,
  type: 'expense',
  category: 'food',
  account_id: 'account',
} as Parameters<typeof TransactionRow>[0]['transaction'];
const account = {
  id: 'account',
  name: 'Current',
  type: 'payroll',
  liquidity: 'spendable',
} as Parameters<typeof AccountCard>[0]['account'];
const series = {
  id: 'series',
  description: 'Rent',
  amount: 100,
  type: 'expense',
  category: 'food',
  frequency: 'monthly',
  is_active: true,
  user_ids: [],
  transaction_ids: [],
  account_id: 'account',
  start_date: '2026-11-01',
  due_day: 1,
  total_executions: 0,
  created_at: '2026-11-01',
  updated_at: '2026-11-01',
} as Parameters<typeof SeriesCard>[0]['series'];
const progress = {
  id: 'budget',
  description: 'Food',
  amount: 100,
  spent: 25,
  remaining: 75,
  percentage: 25,
  categories: [],
  transactionCount: 1,
};
it.each([
  [
    'transaction',
    () => <TransactionRow transaction={transaction} getCategoryLabel={(key) => key} />,
  ],
  ['account', () => <AccountCard account={account} accountBalance={100} />],
  ['recurring series', () => <SeriesCard series={series} daysUntilDue={3} />],
  ['budget', () => <BudgetCategoryCard progress={progress} categories={[]} isSelected={false} />],
] as const)(
  'converts the %s UI without mutating the underlying financial data',
  (_name, component) => {
    const before = JSON.stringify({ transaction, account, series, progress });
    render(
      <CurrencyProvider snapshot={snapshot} locale="en-US">
        {component()}
      </CurrencyProvider>
    );
    expect(screen.getAllByText(/\$120\.00/).length).toBeGreaterThan(0);
    expect(JSON.stringify({ transaction, account, series, progress })).toBe(before);
  }
);
