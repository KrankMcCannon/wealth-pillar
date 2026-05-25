import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalFooterActions } from './modal-footer-actions';

describe('ModalFooterActions', () => {
  it('renders stacked-primary submit without cancel', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <form>
        <ModalFooterActions
          variant="stacked-primary"
          submitLabel="Save transaction"
          deleteLabel="Delete"
          onDelete={onDelete}
        />
      </form>
    );

    expect(screen.getByRole('button', { name: /Save transaction/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('renders dual cancel and submit actions', async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <ModalFooterActions
        variant="dual"
        cancelLabel="Cancel"
        submitLabel="Save"
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
