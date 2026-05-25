import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { EntityFormModal } from './entity-form-modal';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const schema = z.object({ name: z.string().min(1, 'Required') });

function TestHarness({
  autoRootError = true,
  withDeletion = false,
  rootError,
}: {
  autoRootError?: boolean;
  withDeletion?: boolean;
  rootError?: string;
}) {
  return (
    <EntityFormModal
      isOpen
      onClose={() => {}}
      title="Test modal"
      schema={schema}
      defaultValues={{ name: rootError ? 'seed' : '' }}
      resetValues={{ name: rootError ? 'seed' : '' }}
      autoRootError={autoRootError}
      onSubmit={async (_, form) => {
        if (rootError) {
          form.setError('root', { message: rootError });
        }
      }}
      {...(withDeletion
        ? {
            deletion: {
              enabled: true,
              title: 'Delete item',
              message: 'Are you sure?',
              confirmText: 'Delete',
              cancelText: 'Cancel',
              onDelete: vi.fn(async () => {}),
            },
          }
        : {})}
      footer={(_, __, { openDeleteDialog }) => (
        <>
          <button type="submit">Save</button>
          {openDeleteDialog ? (
            <button type="button" onClick={openDeleteDialog}>
              Open delete
            </button>
          ) : null}
        </>
      )}
    >
      {() => <input aria-label="Name" defaultValue="" readOnly />}
    </EntityFormModal>
  );
}

describe('EntityFormModal template defaults', () => {
  it('renders auto root error banner by default after submit failure', async () => {
    const user = userEvent.setup();
    render(<TestHarness rootError="Root failure" />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Root failure');
  });

  it('hides root error banner when autoRootError is false', async () => {
    const user = userEvent.setup();
    render(<TestHarness autoRootError={false} rootError="Root failure" />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens delete confirmation dialog from footer action', async () => {
    const user = userEvent.setup();
    render(<TestHarness withDeletion />);
    await user.click(screen.getByRole('button', { name: 'Open delete' }));
    expect(screen.getByRole('heading', { name: 'Delete item' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });
});
