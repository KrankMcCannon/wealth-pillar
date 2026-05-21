import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteConfirmation } from './use-delete-confirmation';

describe('useDeleteConfirmation', () => {
  it('opens with item and closes after successful delete', async () => {
    const { result } = renderHook(() => useDeleteConfirmation<{ id: string }>());
    const deleteAction = vi.fn().mockResolvedValue(undefined);

    act(() => result.current.openDialog({ id: 'a1' }));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.itemToDelete).toEqual({ id: 'a1' });

    await act(async () => {
      await result.current.executeDelete(deleteAction);
    });

    expect(deleteAction).toHaveBeenCalledWith({ id: 'a1' });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.itemToDelete).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it('resets isDeleting on delete failure', async () => {
    const { result } = renderHook(() => useDeleteConfirmation<{ id: string }>());
    const deleteAction = vi.fn().mockRejectedValue(new Error('fail'));

    act(() => result.current.openDialog({ id: 'a1' }));

    await expect(
      act(async () => {
        await result.current.executeDelete(deleteAction);
      })
    ).rejects.toThrow('fail');

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isDeleting).toBe(false);
  });
});
