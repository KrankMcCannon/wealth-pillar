import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog } from './confirmation-dialog';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (key === 'confirm' ? 'Confirm' : 'Cancel'),
}));

vi.mock('@/components/ui/modal-wrapper', () => ({
  ModalWrapper: ({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        {title}
        {children}
      </div>
    ) : null,
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ConfirmationDialog', () => {
  it('renders children slot, message, and dual footer without icon column', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmationDialog
        isOpen
        title="Delete?"
        message="This cannot be undone."
        onCancel={onCancel}
        onConfirm={vi.fn()}
      >
        <p>Warning list</p>
      </ConfirmationDialog>
    );

    expect(screen.getByText('Warning list')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
