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
  it('shows income minus expenses as net flow', () => {
    render(
      <ReportsHero
        netFlow={60}
        income={100}
        expenses={40}
        comparisonPercent={10}
        comparisonLabel="vs last month"
      />
    );

    expect(screen.getByRole('heading', { name: 'netFlow' })).toBeTruthy();
    expect(screen.getByText('€100')).toBeTruthy();
    expect(screen.getByText('€40')).toBeTruthy();
    expect(screen.getByText('+€60')).toBeTruthy();
    expect(screen.getByRole('meter')).toBeTruthy();
    expect(screen.queryByText('movedToSavings')).toBeNull();
    expect(screen.queryByText('title')).toBeNull();
  });

  it('shows noComparison when comparisonPercent is null', () => {
    render(
      <ReportsHero netFlow={-20} income={0} expenses={20} comparisonPercent={null} />
    );

    expect(screen.getByText('noComparison')).toBeTruthy();
  });
});
