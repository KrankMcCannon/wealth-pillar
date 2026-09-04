import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportsHero } from './reports-hero';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

describe('ReportsHero', () => {
  it('shows income minus expenses as net flow, not transfer savings', () => {
    render(
      <ReportsHero
        netFlow={60}
        income={100}
        expenses={40}
        netSavings={{ deposits: 99, withdrawals: 10, net: 89 }}
        comparisonPercent={10}
        comparisonLabel="vs last month"
      />
    );

    expect(screen.getByText('€100')).toBeTruthy();
    expect(screen.getByText('€40')).toBeTruthy();
    expect(screen.getByText('+€60')).toBeTruthy();
    expect(screen.queryByText('incomeMinusExpenses')).toBeNull();
    expect(screen.queryByText('savedThisPeriod')).toBeNull();
    expect(screen.getByText('movedToSavings')).toBeTruthy();
    expect(screen.getByText('€99')).toBeTruthy();
    expect(screen.getByText('+€89')).toBeTruthy();
  });

  it('shows savings deposits, withdrawals, and net including zeros', () => {
    render(
      <ReportsHero
        netFlow={50}
        income={100}
        expenses={50}
        netSavings={{ deposits: 0, withdrawals: 0, net: 0 }}
        comparisonPercent={10}
        comparisonLabel="vs last month"
      />
    );

    expect(screen.getByText('deposits')).toBeTruthy();
    expect(screen.getByText('withdrawals')).toBeTruthy();
    expect(screen.getByText('+€0')).toBeTruthy();
    expect(screen.queryByText('spendableBalance')).toBeNull();
    expect(screen.queryByText('reserveBalance')).toBeNull();
  });

  it('shows noComparison when comparisonPercent is null', () => {
    render(
      <ReportsHero
        netFlow={-20}
        income={0}
        expenses={20}
        netSavings={{ deposits: 5, withdrawals: 1, net: 4 }}
        comparisonPercent={null}
      />
    );

    expect(screen.getByText('noComparison')).toBeTruthy();
    expect(screen.getByText('€5')).toBeTruthy();
    expect(screen.getByText('€1')).toBeTruthy();
  });
});
