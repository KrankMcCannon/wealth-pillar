import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionsLedger } from './transactions-ledger';
import type { Transaction } from '@/lib/types';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/hooks/use-infinite-scroll-sentinel', () => ({
  useInfiniteScrollSentinel: vi.fn(),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/transactions', () => ({
  TransactionFilters: () => null,
}));

vi.mock('@/components/ui/filters', () => ({
  FilterDrawer: () => null,
  FilterChip: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

vi.mock('./sticky-total', () => ({
  StickyTotal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const filters: TransactionFiltersState = {
  searchQuery: '',
  type: 'all',
  dateRange: 'all',
  categoryKey: 'all',
};

const tx = (overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'amount' | 'description'>): Transaction => ({
  user_id: 'u1',
  group_id: 'g1',
  category: 'tax',
  date: '2026-09-02',
  type: 'expense',
  account_id: 'a1',
  created_at: '2026-09-02',
  updated_at: '2026-09-02',
  ...overrides,
});

describe('TransactionsLedger day totals', () => {
  it('renders the daily net as a caption, not as a row amount', () => {
    render(
      <TransactionsLedger
        accounts={[]}
        transactions={[
          tx({ id: 'tx-1', amount: 240.91, description: 'Bollo Auto' }),
          tx({ id: 'tx-2', amount: 312.28, description: 'Bolletta Acqua' }),
        ]}
        accountNames={{ a1: 'Revolut' }}
        categories={[]}
        filters={filters}
        setFilters={vi.fn()}
        hasMore={false}
        isLoadingMore={false}
        isNavigatingFilters={false}
        onLoadMore={vi.fn()}
        onEditTransaction={vi.fn()}
        onAddTransaction={vi.fn()}
        onImport={vi.fn()}
        emptyTitle="Empty"
        emptyDescription="None"
        selectedUserId={undefined}
      />
    );

    const dayTotal = screen.getByTestId('day-group-total');
    expect(dayTotal).toHaveTextContent('−553,19 €');
    expect(dayTotal).not.toHaveTextContent('Total:');
    expect(dayTotal.querySelector('span:last-child')).toHaveClass('text-base');
    expect(dayTotal.querySelector('span:last-child')).toHaveClass('text-foreground');

    const header = dayTotal.parentElement;
    expect(header).not.toHaveClass('mb-1');
    expect(header).toHaveClass('pb-1');
    expect(header).not.toHaveClass('pb-2');
    expect(header?.parentElement).not.toHaveClass('gap-2');
    expect(header?.parentElement?.parentElement).toHaveClass('mt-3');
    expect(header?.parentElement?.parentElement).toHaveClass('gap-4');

    const row = screen.getByTestId('transaction-row-tx-1');
    expect(row).toHaveTextContent('Bollo Auto');
    expect(row).toHaveTextContent('240,91 €');
    expect(row).not.toHaveTextContent('Total:');
  });
});
