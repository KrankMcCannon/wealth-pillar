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
  it('shows labeled period metrics, not concatenated meta, and omits transactionCount', () => {
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

    expect(screen.getByText('spendableBalance')).toBeTruthy();
    expect(screen.getByText('€80')).toBeTruthy();
    expect(screen.getByText('reserveBalance')).toBeTruthy();
    expect(screen.getByText('€120')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'types.checking' })).toBeTruthy();
    expect(screen.getByText('income')).toBeTruthy();
    expect(screen.getByText('€40')).toBeTruthy();
    expect(screen.getByText('expense')).toBeTruthy();
    expect(screen.getByText('€10')).toBeTruthy();
    expect(screen.getByText('balance')).toBeTruthy();
    expect(screen.getByText('€150')).toBeTruthy();
    expect(screen.getByText('ofWealth')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('+€30')).toBeTruthy();
    expect(screen.queryByText('99')).toBeNull();
  });
});
