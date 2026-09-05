import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetPeriodSection } from './budget-period-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

describe('BudgetPeriodSection', () => {
  it('shows spendable start to end and a signed delta, without on-track badges', () => {
    render(
      <BudgetPeriodSection
        periods={[
          {
            id: 'p1',
            name: '1–30 Sep',
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            startBalance: 100,
            endBalance: 80,
            spendable: { startBalance: 200, endBalance: 150 },
            reserve: { startBalance: 50, endBalance: 60 },
            userId: 'u1',
          },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1–30 Sep' })).toBeTruthy();
    expect(screen.getByText(/€200/)).toBeTruthy();
    expect(screen.getByText(/€150/)).toBeTruthy();
    expect(screen.getByText('€-50')).toBeTruthy();
    expect(screen.queryByText('badgeOnTrack')).toBeNull();
    expect(screen.queryByText('badgeOverBudget')).toBeNull();
  });
});
