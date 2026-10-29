import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetCategoryCard } from './budget-category-card';
import type { BudgetProgress, Category } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const progress = (overrides: Partial<BudgetProgress> = {}): BudgetProgress => ({
  id: 'b1',
  description: 'Spese Personali',
  amount: 200,
  spent: 200,
  remaining: 0,
  percentage: 100,
  categories: ['hobby'],
  transactionCount: 1,
  ...overrides,
});

const categories: Category[] = [
  {
    id: 'cat-1',
    key: 'hobby',
    label: 'Hobby',
    icon: 'sparkles',
    color: '#00aa00',
    group_id: 'g1',
    created_at: '',
    updated_at: '',
  },
];

describe('BudgetCategoryCard', () => {
  it('keeps a visible 100% fill distinct from the track', () => {
    render(<BudgetCategoryCard progress={progress()} categories={categories} isSelected={false} />);

    const fill = screen.getByRole('progressbar').firstElementChild;
    expect(fill?.className).toContain('bg-warning');
    expect(fill?.className).not.toContain('bg-secondary');
    expect(fill?.className).not.toContain('bg-muted');
  });
});
