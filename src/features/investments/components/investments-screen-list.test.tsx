import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvestmentsScreenList } from './investments-screen-list';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

const { openModal } = vi.hoisted(() => ({ openModal: vi.fn() }));

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    if (key === 'shares' && values && 'count' in values) {
      return `${values.shares ?? values.count} shares`;
    }
    if (key === 'editAria' || key === 'editAriaWithChange') {
      return Object.values(values ?? {}).join(', ');
    }
    if (key === 'changeUp' || key === 'changeDown') {
      return `${key} ${values?.amount} ${values?.percent}`;
    }
    return `${ns}.${key}`;
  },
  useLocale: () => 'en-US',
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal }),
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
    render(<InvestmentsScreenList holdings={[]} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Investments.InvestmentList.empty')).toBeTruthy();
  });

  it('keeps the instrument name and lot meta on separate lines', () => {
    render(
      <InvestmentsScreenList
        holdings={[
          {
            id: 'ivv-1',
            name: 'iShares Core S&P 500 ETF',
            symbol: 'IVV',
            amount: 22,
            shares_acquired: 0.034314,
            currency: 'EUR',
            totalPaid: 22,
            currentPrice: 640,
            currentValue: 24.5,
            totalGain: 2.5,
            created_at: '2026-04-01',
          },
        ]}
      />
    );

    expect(screen.queryByText('IVV')).toBeNull();
    expect(screen.getByText('iShares Core S&P 500 ETF')).toBeTruthy();
    expect(screen.getByText(/0\.034314 shares/)).toBeTruthy();
    expect(screen.queryByText(/iShares Core S&P 500 ETF ·/)).toBeNull();
    expect(screen.getByRole('button', { name: /iShares Core S&P 500 ETF/ })).toHaveAccessibleName(
      /0\.034314 shares/
    );
  });

  it('shows marked-to-market value and signed return when a quote exists', () => {
    render(
      <InvestmentsScreenList
        holdings={[
          {
            id: 'ivv-1',
            name: 'IVV Fund',
            symbol: 'IVV',
            amount: 22,
            shares_acquired: 0.03,
            currency: 'EUR',
            totalPaid: 22,
            currentPrice: 640,
            currentValue: 24.5,
            totalGain: 2.5,
            created_at: '2026-04-01',
          },
        ]}
      />
    );

    expect(screen.getByText(/\+2,50/)).toBeTruthy();
    expect(screen.getByText(/11\.4%/)).toBeTruthy();
  });

  it('opens the holding in the edit modal', async () => {
    const user = userEvent.setup();
    openModal.mockClear();
    render(<InvestmentsScreenList holdings={sample} />);

    await user.click(screen.getByTestId('investment-row-inv-0'));
    expect(openModal).toHaveBeenCalledWith('investment', 'inv-0');
  });
});
