import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BudgetPeriodSection } from './budget-period-section';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { consumeReportsScrollY } from '@/features/reports/utils/reports-view-state';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
    allocated: 0,
    remaining: 0,
    isOpen: false,
    ...partial,
  };
  return {
    ...base,
    remaining: partial.remaining ?? Math.round((base.allocated - base.spendableSpent) * 100) / 100,
  };
}

describe('BudgetPeriodSection', () => {
  afterEach(() => {
    sessionStorage.clear();
  });
  it('shows leftover vs allocation for each period', () => {
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
          }),
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1–30 Sep' })).toBeTruthy();
    expect(screen.queryByText('budget')).toBeNull();
    expect(screen.queryByText('reserve')).toBeNull();
    expect(screen.getByText('€4000 − €3345.97')).toBeTruthy();
    expect(screen.getByLabelText('badgeOnTrack +€654.03')).toHaveClass('text-income');
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

    expect(screen.getByText('€2000 − €2500')).toBeTruthy();
    expect(screen.queryByText('€2000 → €2500')).toBeNull();
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

  it('links persisted periods and leaves synthetic rows static', () => {
    render(
      <BudgetPeriodSection
        hrefForPeriod={(row) => `/reports/periods/${row.id}`}
        periods={[
          period({ id: 'closed-1', name: '1–30 Aug', userId: 'u1', isOpen: false }),
          period({
            id: 'open-1',
            name: '1 Sep – Present',
            userId: 'u1',
            isOpen: true,
            startDate: '2026-09-01',
          }),
          period({
            id: 'active-generated-u1',
            name: 'Synthetic',
            userId: 'u1',
            isOpen: true,
          }),
        ]}
      />
    );

    const links = screen.getAllByRole('link', { name: 'openPeriodAria' });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/reports/periods/closed-1');
    expect(links[0]).toContainElement(screen.getByText('1–30 Aug'));
    expect(links[1]).toHaveAttribute('href', '/reports/periods/open-1');
    expect(links[1]).toContainElement(screen.getByText('1 Sep – Present'));
    expect(screen.queryByRole('link', { name: 'Synthetic' })).toBeNull();
    expect(screen.getByText('Synthetic')).toBeTruthy();
  });

  it('collapses every person by default and toggles their periods', () => {
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

    const sam = screen.getByRole('group', { name: 'Sam' }).querySelector('details');
    const alex = screen.getByRole('group', { name: 'Alex' }).querySelector('details');
    expect(sam?.open).toBe(false);
    expect(alex?.open).toBe(false);

    const samSummary = screen.getByRole('group', { name: 'Sam' }).querySelector('summary');
    expect(samSummary).toBeTruthy();
    fireEvent.click(samSummary!);
    expect(screen.getByRole('group', { name: 'Sam' }).querySelector('details')?.open).toBe(true);
  });

  it('saves reports scroll when opening a closed period', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(360);
    render(
      <BudgetPeriodSection
        hrefForPeriod={(row) => `/reports/periods/${row.id}`}
        periods={[period({ id: 'closed-1', name: '1–30 Aug', userId: 'u1', isOpen: false })]}
      />
    );

    fireEvent.click(screen.getByRole('link', { name: 'openPeriodAria' }));
    expect(consumeReportsScrollY()).toBe(360);
  });
});
