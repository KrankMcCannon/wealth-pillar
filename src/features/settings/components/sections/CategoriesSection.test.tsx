import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoriesSection } from './CategoriesSection';

const onManageCategories = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/hooks/use-required-user', () => ({
  useRequiredCurrentUser: () => ({
    id: 'u1',
    group_id: 'g1',
    role: 'admin',
  }),
}));

vi.mock('@/stores/reference-data-store', () => ({
  useCategories: () => [
    {
      id: 'c-custom',
      key: 'custom-food',
      label: 'Spesa custom',
      icon: 'shopping-cart',
      color: '#10B981',
      group_id: 'g1',
      created_at: '',
      updated_at: '',
    },
  ],
}));

describe('CategoriesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a single entry row and opens categories on click', () => {
    render(<CategoriesSection onManageCategories={onManageCategories} />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('manageTitle')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('customTitle')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /manageTitle/i }));
    expect(onManageCategories).toHaveBeenCalledTimes(1);
  });
});
