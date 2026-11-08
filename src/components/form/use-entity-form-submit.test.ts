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

it('retains pending state after timeout, blocks duplicate submissions and commits late success', async () => {
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
    const createAction = vi.fn(() => request);
    const refreshAfterUncertain = vi.fn();
    const { result } = renderHook(() =>
      useEntityFormSubmit({
        submissionKey: 'timeout-test',
        refreshAfterUncertain,
        isEditMode: false,
        onClose,
        buildPayload: (values: FormValues) => values,
        createAction,
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
    expect(form.setError).toHaveBeenCalledWith('root', { message: 'pending' });
    expect(rollbackCreate).not.toHaveBeenCalled();
    expect(refreshAfterUncertain).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current({ name: 'Draft' }, form);
    });
    expect(createAction).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      finish({ data: { id: 'saved' }, error: null });
    });
    expect(commitCreate).toHaveBeenCalledWith('pending', { id: 'saved' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(refreshAfterUncertain).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});

it('holds ownership across remounts and rolls back only a confirmed late failure', async () => {
  vi.useFakeTimers();
  try {
    let finish!: (value: { data: null; error: string }) => void;
    const request = new Promise<{ data: null; error: string }>((resolve) => {
      finish = resolve;
    });
    const createAction = vi.fn(() => request);
    const rollbackCreate = vi.fn();
    const onClose = vi.fn();
    const refreshAfterUncertain = vi.fn();
    const options = {
      submissionKey: 'remount-pending',
      isEditMode: false,
      onClose,
      buildPayload: (values: FormValues) => values,
      createAction,
      updateAction: createAction,
      applyCreateOptimistic: () => 'pending',
      rollbackCreate,
      getSuccessToast: () => ({ title: 'Saved', description: 'Saved' }),
      errorToast: { title: 'Error' },
      unknownErrorMessage: 'Unknown',
      refreshAfterUncertain,
    };
    const first = renderHook(() => useEntityFormSubmit(options));
    let submission!: Promise<void>;
    await act(async () => {
      submission = first.result.current({ name: 'Draft' }, createFormMock());
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
      await submission;
    });
    first.unmount();
    const second = renderHook(() => useEntityFormSubmit(options));
    await act(async () => {
      await second.result.current({ name: 'Draft' }, createFormMock());
    });
    expect(createAction).toHaveBeenCalledTimes(1);
    expect(rollbackCreate).not.toHaveBeenCalled();
    await act(async () => {
      finish({ data: null, error: 'Rejected before commit' });
    });
    expect(rollbackCreate).toHaveBeenCalledExactlyOnceWith('pending', 'Rejected before commit');
    expect(onClose).not.toHaveBeenCalled();
    expect(refreshAfterUncertain).toHaveBeenCalledTimes(2);
    second.unmount();
  } finally {
    vi.useRealTimers();
  }
});
