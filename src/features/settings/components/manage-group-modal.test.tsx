import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManageGroupModal } from './manage-group-modal';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useRequiredGroupUsers: () => [
    { id: 'm1', name: 'Ivana', role: 'member' },
    { id: 'a1', name: 'Edoardo', role: 'admin' },
  ],
}));

vi.mock('@/features/settings/context/settings-modals-context', () => ({
  useSettingsModalsContextOptional: () => null,
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/components/form', () => ({
  EntityFormModal: ({
    children,
    isOpen,
  }: {
    isOpen: boolean;
    children: (form: { control: object; formState: { isSubmitting: boolean } }) => React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="entity-form-modal">
        {children({ control: {}, formState: { isSubmitting: false } })}
      </div>
    ) : null,
}));

vi.mock('@/components/form/modal-fields', () => ({
  ModalTextField: ({ label }: { label: string }) => (
    <label>
      <span>{label}</span>
      <input />
    </label>
  ),
}));

describe('ManageGroupModal', () => {
  it('lists members with role on the right, admins first', () => {
    render(<ManageGroupModal isOpen onClose={vi.fn()} groupId="g1" groupName="Famiglia" isAdmin />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Edoardo');
    expect(items[0]).toHaveTextContent('roles.admin');
    expect(items[1]).toHaveTextContent('Ivana');
    expect(items[1]).toHaveTextContent('roles.member');
    expect(screen.getByText('nameLabel')).toBeInTheDocument();
  });
});
