import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { useEntityFormSubmit } from './use-entity-form-submit';

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

  it('closes before create, refreshes and toasts on success', async () => {
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

    expect(onClose).toHaveBeenCalledBefore(createAction);
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
