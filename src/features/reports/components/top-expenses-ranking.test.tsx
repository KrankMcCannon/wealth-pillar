import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopExpensesRanking } from './top-expenses-ranking';
import type { TopExpenseRow } from './top-expenses-ranking';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'percentOfExpenses' && values && 'percent' in values) {
      return `${values.percent}% of spend`;
    }
    return key;
  },
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

const food: TopExpenseRow = {
  id: 'uuid-food',
  key: 'food',
  name: 'Food',
  total: 40,
  color: '#00aa00',
};
const housing: TopExpenseRow = {
  id: 'uuid-housing',
  key: 'housing',
  name: 'Housing',
  total: 30,
  color: '#0000aa',
};
const transport: TopExpenseRow = {
  id: 'uuid-transport',
  key: 'transport',
  name: 'Transport',
  total: 20,
  color: '#aa0000',
};

describe('TopExpensesRanking', () => {
  it('renders the empty well when there are no items', () => {
    render(<TopExpensesRanking items={[]} periodExpenses={100} />);
    expect(screen.getByText('empty')).toBeTruthy();
  });

  it('sizes bars as percent of period expenses, not of the max row', () => {
    render(
      <TopExpensesRanking items={[food, housing, transport]} periodExpenses={100} />
    );

    expect(screen.getByText('40% of spend')).toBeTruthy();
    expect(screen.getByText('30% of spend')).toBeTruthy();
    expect(screen.getByText('20% of spend')).toBeTruthy();
    expect(screen.queryByText('100% of spend')).toBeNull();
  });

  it('does not throw or show Other when period expenses are zero', () => {
    render(<TopExpensesRanking items={[food]} periodExpenses={0} />);
    expect(screen.getByText('empty')).toBeTruthy();
    expect(screen.queryByTestId('reports-other-remainder')).toBeNull();
  });

  it('renders a non-interactive Other remainder and links category rows by key', () => {
    render(
      <TopExpensesRanking
        items={[food, housing, transport]}
        periodExpenses={100}
        hrefForCategory={(key) => `/transactions?category=${key}`}
      />
    );

    const foodLink = screen.getByRole('link', { name: /Food/ });
    expect(foodLink.getAttribute('href')).toBe('/transactions?category=food');
    expect(foodLink.getAttribute('href')).not.toContain('uuid-food');

    const other = screen.getByTestId('reports-other-remainder');
    expect(other.querySelector('a')).toBeNull();
    expect(other.textContent).toContain('other');
    expect(other.textContent).toContain('€10');
  });
});
