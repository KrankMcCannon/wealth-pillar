import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { useEntityFormSubmit } from './use-entity-form-submit';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

type FormValues = { name: string };

function createFormMock(): UseFormReturn<FormValues> {
  return {
    setError: vi.fn(),
  } as unknown as UseFormReturn<FormValues>;
}

describe('useEntityFormSubmit', () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  it('closes after create, refreshes and toasts on success', async () => {
    const onClose = vi.fn();
    const refreshAfterSuccess = vi.fn();
    const createAction = vi.fn(async () => ({ data: { id: '1' }, error: null }));

    const { result } = renderHook(() =>
      useEntityFormSubmit<FormValues, { name: string }, { id: string }>({
        isEditMode: false,
        onClose,
        buildPayload: (values) => ({ name: values.name }),
        createAction,
        updateAction: vi.fn(),
        getSuccessToast: () => ({ title: 'Created', description: 'Done' }),
        errorToast: { title: 'Error' },
        refreshAfterSuccess,
        unknownErrorMessage: 'Unknown',
      })
    );

    const form = createFormMock();
    await act(async () => {
      await result.current({ name: 'Test' }, form);
    });

    expect(createAction).toHaveBeenCalledBefore(onClose);
    expect(createAction).toHaveBeenCalledWith({ name: 'Test' });
    expect(refreshAfterSuccess).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Created', variant: 'success' })
    );
  });

  it('rolls back optimistic create and toasts on action error', async () => {
    const onClose = vi.fn();
    const rollbackCreate = vi.fn();
    const createAction = vi.fn(async () => ({ data: null, error: 'Failed' }));

    const { result } = renderHook(() =>
      useEntityFormSubmit<FormValues, { name: string }, { id: string }, string>({
        isEditMode: false,
        onClose,
        buildPayload: (values) => ({ name: values.name }),
        createAction,
        updateAction: vi.fn(),
        applyCreateOptimistic: () => 'temp-1',
        rollbackCreate,
        getSuccessToast: () => ({ title: 'Created', description: 'Done' }),
        errorToast: { title: 'Error' },
        unknownErrorMessage: 'Unknown',
      })
    );

    await act(async () => {
      await result.current({ name: 'Test' }, createFormMock());
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(rollbackCreate).toHaveBeenCalledWith('temp-1', 'Failed');
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', variant: 'destructive' })
    );
  });

  it('updates in edit mode and commits optimistic result', async () => {
    const onClose = vi.fn();
    const commitUpdate = vi.fn();
    const updateAction = vi.fn(async () => ({ data: { id: 'row-1' }, error: null }));

    const { result } = renderHook(() =>
      useEntityFormSubmit<FormValues, { name: string }, { id: string }, string>({
        isEditMode: true,
        editId: 'row-1',
        onClose,
        buildPayload: (values) => ({ name: values.name }),
        createAction: vi.fn(),
        updateAction,
        applyUpdateOptimistic: () => 'handle-1',
        commitUpdate,
        getSuccessToast: () => ({ title: 'Updated', description: 'Done' }),
        errorToast: { title: 'Error' },
        unknownErrorMessage: 'Unknown',
      })
    );

    await act(async () => {
      await result.current({ name: 'Edited' }, createFormMock());
    });

    expect(updateAction).toHaveBeenCalledWith('row-1', { name: 'Edited' });
    expect(commitUpdate).toHaveBeenCalledWith('handle-1', { id: 'row-1' });
  });
});

it('rolls back and keeps the modal open on timeout, ignoring a late successful action', async () => {
  vi.useFakeTimers();
  try {
    let finish!: (value: { data: { id: string }; error: null }) => void;
    const request = new Promise<{ data: { id: string }; error: null }>((resolve) => {
      finish = resolve;
    });
    const onClose = vi.fn();
    const commitCreate = vi.fn();
    const rollbackCreate = vi.fn();
    const form = createFormMock();
    const { result } = renderHook(() =>
      useEntityFormSubmit({
        isEditMode: false,
        onClose,
        buildPayload: (values: FormValues) => values,
        createAction: () => request,
        updateAction: () => request,
        applyCreateOptimistic: () => 'pending',
        commitCreate,
        rollbackCreate,
        getSuccessToast: () => ({ title: 'Saved', description: 'Saved' }),
        errorToast: { title: 'Error' },
        unknownErrorMessage: 'Failed',
      })
    );
    let submission!: Promise<void>;
    await act(async () => {
      submission = result.current({ name: 'Draft' }, form);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
      await submission;
    });
    expect(form.setError).toHaveBeenCalledWith('root', { message: 'timeout' });
    expect(rollbackCreate).toHaveBeenCalledWith('pending', 'timeout');
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      finish({ data: { id: 'saved' }, error: null });
    });
    expect(commitCreate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
