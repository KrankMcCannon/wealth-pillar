import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountBreakdownSection } from './account-breakdown-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && 'percent' in values) return `${values.percent}%`;
    return key;
  },
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

const checking = {
  accountType: 'checking',
  totalBalance: 150,
  totalEarned: 40,
  totalSpent: 10,
  transactionCount: 99,
};

describe('AccountBreakdownSection', () => {
  it('shows each balance once with a share bar, and hides empty types', () => {
    render(
      <AccountBreakdownSection
        totalWealth={200}
        rows={[
          checking,
          {
            accountType: 'cash',
            totalBalance: 0,
            totalEarned: 0,
            totalSpent: 0,
            transactionCount: 0,
          },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'types.checking' })).toBeTruthy();
    expect(screen.getByText('€150')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'types.checking, 75%' })).toBeTruthy();
    expect(screen.queryByText('types.cash')).toBeNull();
    expect(screen.queryByText(/spendableBalance/)).toBeNull();
    expect(screen.queryByText(/reserveBalance/)).toBeNull();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.queryByText(/\+€30/)).toBeNull();
    expect(screen.queryByText('99')).toBeNull();
  });
});
