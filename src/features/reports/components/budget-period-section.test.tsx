import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetPeriodSection } from './budget-period-section';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

function period(
  partial: Partial<ReportPeriodSummary> & Pick<ReportPeriodSummary, 'id' | 'name' | 'userId'>
): ReportPeriodSummary {
  const base: ReportPeriodSummary = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    spendableSpent: 50,
    reserveSaved: 0,
    allocated: 0,
    remaining: 0,
    reserveStart: 0,
    reserveEnd: 0,
    ...partial,
  };
  return {
    ...base,
    remaining: partial.remaining ?? Math.round((base.allocated - base.spendableSpent) * 100) / 100,
  };
}

describe('BudgetPeriodSection', () => {
  it('shows labeled riserva and budget columns with colored deltas', () => {
    render(
      <BudgetPeriodSection
        periods={[
          period({
            id: 'p1',
            name: '1–30 Sep',
            userId: 'u1',
            allocated: 4000,
            spendableSpent: 3345.97,
            remaining: 654.03,
            reserveStart: 2000,
            reserveEnd: 3000,
          }),
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1–30 Sep' })).toBeTruthy();
    expect(screen.getByText('reserve')).toBeTruthy();
    expect(screen.getByText('budget')).toBeTruthy();
    expect(screen.getByText('€2000 → €3000')).toBeTruthy();
    expect(screen.getByLabelText('reserve +€1000')).toHaveClass('text-income');
    expect(screen.getByLabelText('badgeOnTrack +€654.03')).toHaveClass('text-income');
    expect(screen.getByText('€4000')).toBeTruthy();
  });

  it('shows remaining in red when spend exceeds allocation', () => {
    render(
      <BudgetPeriodSection
        periods={[
          period({
            id: 'p1',
            name: '1–30 Sep',
            userId: 'u1',
            allocated: 2000,
            spendableSpent: 2500,
            remaining: -500,
          }),
        ]}
      />
    );

    expect(screen.queryByText('€2000 → €-500')).toBeNull();
    expect(screen.getByText('€2000')).toBeTruthy();
    const remaining = screen.getByLabelText('badgeOverBudget €-500');
    expect(remaining).toHaveClass('text-expense');
  });

  it('groups periods by person with the logged-in user first', () => {
    render(
      <BudgetPeriodSection
        viewerId="u2"
        users={[
          { id: 'u1', name: 'Alex' },
          { id: 'u2', name: 'Sam' },
        ]}
        periods={[
          period({ id: 'p2', name: '1–30 Aug', userId: 'u2', startDate: '2026-08-01' }),
          period({ id: 'p1', name: '1–30 Sep', userId: 'u1' }),
        ]}
      />
    );

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'title',
      'Sam',
      'Alex',
    ]);
    expect(screen.getByRole('group', { name: 'Alex' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Sam' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '1–30 Sep' })).toBeNull();
    expect(screen.queryByRole('heading', { name: '1–30 Aug' })).toBeNull();
    expect(screen.getByText('1–30 Sep')).toBeTruthy();
    expect(screen.getByText('1–30 Aug')).toBeTruthy();
  });

  it('keeps a personal timeline when two periods belong to the same user', () => {
    render(
      <BudgetPeriodSection
        users={[{ id: 'u1', name: 'Alex' }]}
        periods={[
          period({ id: 'p1', name: '1–30 Sep', userId: 'u1' }),
          period({ id: 'p2', name: '1–30 Aug', userId: 'u1', startDate: '2026-08-01' }),
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: '1–30 Sep' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1–30 Aug' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alex' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Alex' })).toBeNull();
  });
});
