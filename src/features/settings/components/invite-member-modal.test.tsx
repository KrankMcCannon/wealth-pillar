import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteMemberModal } from './invite-member-modal';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
  ModalTextField: ({
    label,
    placeholder,
    layout,
  }: {
    label: string;
    placeholder: string;
    layout?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input placeholder={placeholder} data-layout={layout} />
    </label>
  ),
}));

describe('InviteMemberModal', () => {
  it('renders a plain email field without the invitation note', () => {
    render(<InviteMemberModal isOpen onClose={vi.fn()} groupId="g1" currentUserId="u1" />);

    expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveAttribute('data-layout', 'plain');
    expect(screen.queryByText('noteLabel')).not.toBeInTheDocument();
    expect(screen.queryByText('noteText')).not.toBeInTheDocument();
  });
});
