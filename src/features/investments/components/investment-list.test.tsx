import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestmentList } from './investment-list';
import type { Investment } from './personal-investment-tab';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => 'en-US',
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/features/transactions', () => ({
  TransactionPagination: () => <div data-testid="pagination" />,
}));

const sample: Investment[] = Array.from({ length: 12 }, (_, i) => ({
  id: `inv-${i}`,
  name: `Asset ${i}`,
  symbol: `SYM${i}`,
  amount: 100,
  shares_acquired: 1,
  currency: 'EUR',
  totalPaid: 100,
  created_at: `2024-01-${String(i + 1).padStart(2, '0')}`,
}));

describe('InvestmentList', () => {
  it('renders empty state when there are no investments', () => {
    render(<InvestmentList investments={[]} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Investments.InvestmentList.empty')).toBeTruthy();
  });

  it('paginates investments', () => {
    render(<InvestmentList investments={sample} />);
    expect(screen.getByText('SYM11')).toBeTruthy();
    expect(screen.queryByText('SYM0')).toBeNull();
  });
});
