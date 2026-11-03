import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageCategoriesModal } from './manage-categories-modal';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { SYSTEM_GROUP_ID } from '@/lib/constants';
import type { Category } from '@/lib/types';
const openModal = vi.fn();
vi.mock('@/features/categories/actions/category-actions', () => ({
  getAllCategoriesAction: vi.fn(),
}));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/hooks/use-required-user', () => ({
  useRequiredCurrentUser: () => ({ id: 'u1', group_id: 'g1', role: 'admin' }),
}));
vi.mock('@/lib/navigation/url-state', () => ({ useModalState: () => ({ openModal }) }));
vi.mock('@/components/ui/category-badge', () => ({ CategoryBadge: () => <span /> }));
vi.mock('@/components/ui/modal-wrapper', () => ({
  ModalWrapper: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalSection: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  ),
}));
const category = (id: string, groupId: string): Category => ({
  id,
  key: id,
  label: id,
  icon: 'ShoppingBasket',
  color: '#6366F1',
  group_id: groupId,
  created_at: '',
  updated_at: '',
});
const catalog = [
  ...Array.from({ length: 14 }, (_, i) => category(`Sistema ${i + 1}`, SYSTEM_GROUP_ID)),
  ...Array.from({ length: 35 }, (_, i) => category(`Gruppo ${i + 1}`, 'g1')),
];
beforeEach(() => {
  vi.clearAllMocks();
  useReferenceDataStore.getState().reset();
  useReferenceDataStore
    .getState()
    .initialize({ accounts: [], categories: [], usedCategoryKeys: ['Gruppo 1'] });
  vi.mocked(getAllCategoriesAction).mockResolvedValue({ data: catalog, error: null });
});
describe('category management with real shared state', () => {
  it('loads and renders system and group categories from an initially empty store', async () => {
    render(<ManageCategoriesModal isOpen onClose={vi.fn()} />);
    expect(screen.queryByText('emptyCustom')).not.toBeInTheDocument();
    expect(await screen.findByText('Sistema 14')).toBeInTheDocument();
    expect(screen.getByText('Gruppo 35')).toBeInTheDocument();
    expect(screen.getAllByText(/^Sistema \d+$/)).toHaveLength(14);
    expect(screen.getAllByText(/^Gruppo \d+$/)).toHaveLength(35);
    expect(screen.getByText('inUseBadge')).toBeInTheDocument();
    expect(useReferenceDataStore.getState().categories).toHaveLength(49);
  });
  it('shows a failed load and retries instead of claiming that there are no categories', async () => {
    vi.mocked(getAllCategoriesAction).mockResolvedValueOnce({
      data: null,
      error: 'Temporary database failure',
    });
    render(<ManageCategoriesModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('loadError');
    expect(screen.queryByText('emptySystem')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'retry' }));
    expect(await screen.findByText('Sistema 14')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('keeps another group out of the catalog and reflects new group categories', async () => {
    vi.mocked(getAllCategoriesAction).mockResolvedValueOnce({
      data: [...catalog, category('Altro gruppo', 'g2')],
      error: null,
    });
    render(<ManageCategoriesModal isOpen onClose={vi.fn()} />);
    await screen.findByText('Gruppo 35');
    expect(screen.queryByText('Altro gruppo')).not.toBeInTheDocument();
    act(() => useReferenceDataStore.getState().addCategory(category('Appena creata', 'g1')));
    await waitFor(() => expect(screen.getByText('Appena creata')).toBeInTheDocument());
  });
});

it('makes both category scopes directly reachable and searches the loaded catalog', async () => {
  const user = userEvent.setup();
  render(<ManageCategoriesModal isOpen onClose={vi.fn()} />);
  await screen.findByText('Sistema 14');
  await user.click(screen.getByRole('radio', { name: /systemFilter/ }));
  expect(screen.queryByText('Gruppo 35')).not.toBeInTheDocument();
  expect(screen.getAllByText(/^Sistema \d+$/)).toHaveLength(14);
  await user.type(screen.getByRole('searchbox', { name: 'searchPlaceholder' }), 'Sistema 14');
  expect(screen.getAllByText(/^Sistema \d+$/)).toHaveLength(1);
  await user.clear(screen.getByRole('searchbox'));
  await user.click(screen.getByRole('radio', { name: /groupFilter/ }));
  expect(screen.getAllByText(/^Gruppo \d+$/)).toHaveLength(35);
  expect(screen.queryByText('Sistema 14')).not.toBeInTheDocument();
});
