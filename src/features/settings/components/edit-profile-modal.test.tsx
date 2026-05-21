import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditProfileModal } from './edit-profile-modal';

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
  ModalTextField: ({ label }: { label: string }) => (
    <label className="text-modal-fg-muted">
      <span>{label}</span>
      <input />
    </label>
  ),
}));

describe('EditProfileModal', () => {
  it('uses dark modal field labels when open', () => {
    const { container } = render(
      <EditProfileModal
        isOpen
        onClose={vi.fn()}
        userId="u1"
        currentName="Ivan"
        currentEmail="ivan@example.com"
      />
    );
    expect(screen.getByTestId('entity-form-modal')).toBeInTheDocument();
    expect(container.querySelector('.text-modal-fg-muted')).toBeInTheDocument();
  });
});
