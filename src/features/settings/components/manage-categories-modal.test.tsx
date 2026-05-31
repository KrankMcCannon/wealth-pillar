import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManageCategoriesModal } from './manage-categories-modal';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

const openModal = vi.fn();

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
    {
      id: 'c-system',
      key: 'food',
      label: 'Alimentari',
      icon: 'utensils',
      color: '#6366F1',
      group_id: SYSTEM_GROUP_ID,
      created_at: '',
      updated_at: '',
    },
  ],
  useUsedCategoryKeys: () => ['custom-food'],
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal }),
}));

vi.mock('@/components/ui/category-badge', () => ({
  CategoryBadge: () => <div data-testid="category-badge" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/modal-wrapper', () => ({
  ModalWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="manage-categories-modal">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalSection: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <section>
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  ),
}));

describe('ManageCategoriesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders custom and system sections with in-use badge', () => {
    render(<ManageCategoriesModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('customTitle')).toBeInTheDocument();
    expect(screen.getByText('systemTitle')).toBeInTheDocument();
    expect(screen.getByText('Spesa custom')).toBeInTheDocument();
    expect(screen.getByText('Alimentari')).toBeInTheDocument();
    expect(screen.getByText('inUseBadge')).toBeInTheDocument();
  });
});
