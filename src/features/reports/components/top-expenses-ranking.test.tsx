import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopExpensesRanking } from './top-expenses-ranking';
import type { TopExpenseRow } from './top-expenses-ranking';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'percentOfExpenses' && values && 'percent' in values) {
      return `${values.percent}% of spend`;
    }
    if (key === 'remainingCategories' && values && 'count' in values) {
      return `${values.count} more categories`;
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
    render(<TopExpensesRanking items={[food, housing, transport]} periodExpenses={100} />);

    expect(screen.getByText('40% of spend')).toBeTruthy();
    expect(screen.getByText('30% of spend')).toBeTruthy();
    expect(screen.getByText('20% of spend')).toBeTruthy();
    expect(screen.queryByText('100% of spend')).toBeNull();
    expect(screen.getByRole('progressbar', { name: /Food/ })).toHaveAttribute(
      'aria-valuenow',
      '40'
    );
  });

  it('folds named rows after five into remaining categories', () => {
    const items: TopExpenseRow[] = Array.from({ length: 12 }, (_, i) => ({
      id: `id-${i}`,
      key: `k${i}`,
      name: `Cat ${i}`,
      total: 10,
      color: '#000000',
    }));
    render(<TopExpensesRanking items={items} periodExpenses={120} />);

    expect(screen.getByText('Cat 0')).toBeTruthy();
    expect(screen.getByText('Cat 4')).toBeTruthy();
    expect(screen.queryByText('Cat 5')).toBeNull();
    const remaining = screen.getByTestId('reports-remaining-categories');
    expect(remaining.textContent).toContain('7 more categories');
    expect(remaining.textContent).toContain('€70');
  });

  it('does not throw or show remaining when period expenses are zero', () => {
    render(<TopExpensesRanking items={[food]} periodExpenses={0} />);
    expect(screen.getByText('empty')).toBeTruthy();
    expect(screen.queryByTestId('reports-remaining-categories')).toBeNull();
  });

  it('does not use Other as the remaining label when a category is named Other', () => {
    const namedOther: TopExpenseRow = {
      id: 'uuid-other',
      key: 'other',
      name: 'Other',
      total: 15,
      color: '#666666',
    };
    render(
      <TopExpensesRanking items={[food, housing, transport, namedOther]} periodExpenses={120} />
    );

    expect(screen.getByText('Other')).toBeTruthy();
    expect(screen.getByTestId('reports-remaining-categories').textContent).toContain(
      'remainingSpending'
    );
  });

  it('renders a non-interactive remaining row and links category rows by key', () => {
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

    const remaining = screen.getByTestId('reports-remaining-categories');
    expect(remaining.querySelector('a')).toBeNull();
    expect(remaining.textContent).toContain('remainingSpending');
    expect(remaining.textContent).toContain('€10');
  });
});
