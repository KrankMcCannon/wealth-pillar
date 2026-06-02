import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestmentsScreenList } from './investments-screen-list';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    if (key === 'shares' && values && 'count' in values) {
      return `${values.count} shares`;
    }
    return `${ns}.${key}`;
  },
  useLocale: () => 'en-US',
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/hooks/use-infinite-scroll-sentinel', () => ({
  useInfiniteScrollSentinel: vi.fn(),
}));

vi.mock('@/components/ui/layout/row-card', () => ({
  RowCard: ({ title, primaryValue }: { title: string; primaryValue?: string }) => (
    <div data-testid="row-card">
      <span>{title}</span>
      {primaryValue ? <span>{primaryValue}</span> : null}
    </div>
  ),
}));

const sample: InvestmentListItem[] = Array.from({ length: 3 }, (_, i) => ({
  id: `inv-${i}`,
  name: `Asset ${i}`,
  symbol: `SYM${i}`,
  amount: 100,
  shares_acquired: 1,
  currency: 'EUR',
  totalPaid: 100,
  created_at: `2024-01-${String(i + 1).padStart(2, '0')}`,
}));

describe('InvestmentsScreenList', () => {
  it('renders empty state when there are no holdings', () => {
    render(
      <InvestmentsScreenList
        holdings={[]}
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
      />
    );
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Investments.InvestmentList.empty')).toBeTruthy();
  });

  it('renders holdings rows', () => {
    render(
      <InvestmentsScreenList
        holdings={sample}
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
      />
    );
    expect(screen.getByText('SYM0')).toBeTruthy();
    expect(screen.getByText('SYM2')).toBeTruthy();
  });

  it('shows load more button when hasMore is true', () => {
    render(
      <InvestmentsScreenList holdings={sample} hasMore isLoadingMore={false} onLoadMore={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Transactions.LoadMore.cta' })).toBeTruthy();
  });
});
