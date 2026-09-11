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

const mockStoreAccounts = vi.hoisted(() => vi.fn((): import('@/lib/types').Account[] => []));

vi.mock('@/stores/reference-data-store', () => ({
  useAccounts: () => mockStoreAccounts(),
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

function renderLedger(
  filterOverrides: Partial<TransactionFiltersState> = {},
  extras: {
    setFilters?: ReturnType<typeof vi.fn>;
    onClearBudgetFilter?: () => void;
  } = {}
) {
  const setFilters = extras.setFilters ?? vi.fn();
  render(
    <TransactionsLedger
      accounts={[]}
      transactions={[tx({ id: 'tx-1', amount: 10, description: 'Caffè' })]}
      accountNames={{ a1: 'Revolut' }}
      categories={[]}
      filters={{ ...filters, ...filterOverrides }}
      setFilters={setFilters}
      hasMore={false}
      isLoadingMore={false}
      isNavigatingFilters={false}
      onLoadMore={vi.fn()}
      onEditTransaction={vi.fn()}
      onAddTransaction={vi.fn()}
      emptyTitle="Empty"
      emptyDescription="None"
      selectedUserId={undefined}
      {...(extras.onClearBudgetFilter ? { onClearBudgetFilter: extras.onClearBudgetFilter } : {})}
    />
  );
  return { setFilters };
}

describe('TransactionsLedger filter button', () => {
  it('hides the count when no advanced filters are set', () => {
    renderLedger();
    expect(screen.getByRole('button', { name: 'filters' })).not.toHaveTextContent(/\d/);
    expect(screen.queryByRole('button', { name: 'clearAll' })).toBeNull();
  });

  it('shows how many advanced filters are set', () => {
    renderLedger({ dateRange: 'month', accountId: 'a1' });
    const button = screen.getByRole('button', { name: 'filtersActiveAria' });
    expect(button).toHaveTextContent('2');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears advanced filters from the ledger toolbar', () => {
    const setFilters = vi.fn();
    const onClearBudgetFilter = vi.fn();
    renderLedger(
      { dateRange: 'month', searchQuery: 'rent', type: 'expense' },
      { setFilters, onClearBudgetFilter }
    );
    screen.getByRole('button', { name: 'clearAll' }).click();
    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: 'all',
        searchQuery: 'rent',
        type: 'expense',
      })
    );
    expect(onClearBudgetFilter).toHaveBeenCalled();
  });
});

describe('TransactionsLedger spendable', () => {
  it('uses live account balances from the store after mutations', () => {
    mockStoreAccounts.mockReturnValue([
      {
        id: 'cash',
        name: 'Cash',
        type: 'payroll',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 2293.07,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ]);
    renderLedger();
    expect(screen.getByText('2.293,07 €')).toBeInTheDocument();
    mockStoreAccounts.mockReturnValue([]);
  });
});
