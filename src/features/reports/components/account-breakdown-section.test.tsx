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

describe('AccountBreakdownSection', () => {
  it('leads with balance per type and keeps spendable/reserve as one meta line', () => {
    render(
      <AccountBreakdownSection
        totalWealth={200}
        totalSpendable={80}
        totalReserve={120}
        rows={[
          {
            accountType: 'checking',
            totalBalance: 150,
            totalEarned: 40,
            totalSpent: 10,
            transactionCount: 99,
          },
        ]}
      />
    );

    expect(screen.getByText(/spendableBalance/)).toBeTruthy();
    expect(screen.getByText('€80')).toBeTruthy();
    expect(screen.getByText(/reserveBalance/)).toBeTruthy();
    expect(screen.getByText('€120')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'types.checking' })).toBeTruthy();
    expect(screen.getByText('€150')).toBeTruthy();
    expect(screen.getByText(/75%/)).toBeTruthy();
    expect(screen.getByRole('meter')).toBeTruthy();
    expect(screen.queryByText(/\+€30/)).toBeNull();
    expect(screen.queryByText('income')).toBeNull();
    expect(screen.queryByText('expense')).toBeNull();
    expect(screen.queryByText('99')).toBeNull();
  });
});
