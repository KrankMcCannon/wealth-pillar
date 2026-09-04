import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetSection } from './budget-section';
import type { UserBudgetSummary } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const summary: UserBudgetSummary = {
  user: { id: 'u1', name: 'Ada' } as UserBudgetSummary['user'],
  budgets: [
    {
      id: 'b1',
      description: 'Food',
      amount: 200,
      spent: 50,
      remaining: 150,
      percentage: 25,
      categories: [],
      transactionCount: 1,
    },
  ],
  activePeriod: { id: 'p1' } as UserBudgetSummary['activePeriod'],
  periodStart: '2026-09-01',
  periodEnd: null,
  totalBudget: 200,
  totalSpent: 50,
  totalRemaining: 150,
  overallPercentage: 25,
};

describe('BudgetSection', () => {
  it('leads with remaining, not allocated total, and exposes a progressbar', () => {
    render(<BudgetSection budgetsByUser={{ u1: summary }} />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText(/150/)).toBeTruthy();
    expect(screen.queryByText('categoryCard.badgeOnTrack')).toBeNull();
    expect(screen.getByText(/periodOngoing/)).toBeTruthy();
    expect(screen.queryByText('spentPrefix')).toBeNull();
    expect(screen.queryByText('assignedPrefix')).toBeNull();
  });
});
