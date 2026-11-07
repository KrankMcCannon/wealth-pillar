import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
              testId: 'entity-form-delete',
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

  it('opens delete confirmation from header action', async () => {
    const user = userEvent.setup();
    render(<TestHarness withDeletion />);
    await user.click(screen.getByTestId('entity-form-delete'));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });
});

it('preserves edited fields when optimistic data is rolled back', async () => {
  const user = userEvent.setup();
  const view = (name: string) => (
    <EntityFormModal
      isOpen
      onClose={() => {}}
      title="Draft"
      schema={schema}
      defaultValues={{ name }}
      resetValues={{ name }}
      onSubmit={async () => {}}
    >
      {(form) => <input aria-label="Editable name" {...form.register('name')} />}
    </EntityFormModal>
  );
  const { rerender } = render(view('Original'));
  const input = screen.getByLabelText('Editable name');
  await user.clear(input);
  await user.type(input, 'User draft');
  rerender(view('Rolled back server value'));
  expect(input).toHaveValue('User draft');
});

it('keeps validation errors visible after submitting a pristine form', async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  render(
    <EntityFormModal
      isOpen
      onClose={() => {}}
      title="Validate"
      schema={schema}
      defaultValues={{ name: '' }}
      resetValues={{ name: '' }}
      onSubmit={submit}
      footer={() => <button type="submit">Save</button>}
    >
      {(form) => (
        <>
          <input aria-label="Name" {...form.register('name')} />
          {form.formState.errors.name?.message ? (
            <p role="alert">{form.formState.errors.name.message}</p>
          ) : null}
        </>
      )}
    </EntityFormModal>
  );
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Required');
  expect(submit).not.toHaveBeenCalled();
});

it('unlocks the form after an unexpected rejection and keeps the draft', async () => {
  const user = userEvent.setup();
  render(
    <EntityFormModal
      isOpen
      onClose={() => {}}
      title="Failure"
      schema={schema}
      defaultValues={{ name: 'Draft' }}
      onSubmit={async () => {
        throw new Error('database failure');
      }}
      footer={(_, pending) => (
        <button disabled={pending} type="submit">
          Save
        </button>
      )}
    >
      {(form) => <input aria-label="Draft" {...form.register('name')} />}
    </EntityFormModal>
  );
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('error');
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  expect(screen.getByLabelText('Draft')).toHaveValue('Draft');
});

it('releases React Hook Form submitting state after a timeout without erasing the draft', async () => {
  vi.useFakeTimers();
  try {
    render(
      <EntityFormModal
        isOpen
        onClose={() => {}}
        title="Timeout"
        schema={schema}
        defaultValues={{ name: 'Keep me' }}
        onSubmit={() => new Promise(() => {})}
        footer={(_, pending) => (
          <button disabled={pending} type="submit">
            Save
          </button>
        )}
      >
        {(form) => <input aria-label="Preserved draft" {...form.register('name')} />}
      </EntityFormModal>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25_000);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('timeout');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByLabelText('Preserved draft')).toHaveValue('Keep me');
  } finally {
    vi.useRealTimers();
  }
});

it('shows recovery instead of editable defaults when loading the original entity fails', () => {
  const retry = vi.fn();
  render(
    <EntityFormModal
      isOpen
      onClose={() => {}}
      title="Unavailable"
      schema={schema}
      defaultValues={{ name: 'Incorrect default' }}
      loadFailed
      onRetryLoad={retry}
      onSubmit={async () => {}}
    >
      {(form) => <input aria-label="Entity" {...form.register('name')} />}
    </EntityFormModal>
  );
  expect(screen.getByRole('alert')).toHaveTextContent('loadError');
  expect(screen.queryByLabelText('Entity')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'retry' }));
  expect(retry).toHaveBeenCalledOnce();
});
