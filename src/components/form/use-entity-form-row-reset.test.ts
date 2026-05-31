import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntityFormRowReset } from './use-entity-form-row-reset';

describe('useEntityFormRowReset', () => {
  const createValues = { name: 'new' };

  it('returns createValues immediately in create mode', () => {
    const { result } = renderHook(() =>
      useEntityFormRowReset({
        createValues,
        loadEditValues: vi.fn(),
      })
    );

    expect(result.current.isReady).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.resetValues).toEqual(createValues);
  });

  it('loads edit values and skips create fallback', async () => {
    const loadEditValues = vi.fn(async () => ({ name: 'loaded' }));

    const { result } = renderHook(() =>
      useEntityFormRowReset({
        editId: 'row-1',
        createValues,
        loadEditValues,
      })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);
    expect(result.current.resetValues).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.resetValues).toEqual({ name: 'loaded' });
    expect(loadEditValues).toHaveBeenCalledWith('row-1', expect.any(AbortSignal));
  });

  it('returns sync edit values immediately without async load', () => {
    const loadEditValues = vi.fn(async () => ({ name: 'loaded' }));

    const { result } = renderHook(() =>
      useEntityFormRowReset({
        editId: 'row-1',
        createValues,
        loadEditValues,
        getEditValuesSync: () => ({ name: 'sync' }),
      })
    );

    expect(result.current.isReady).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.resetValues).toEqual({ name: 'sync' });
    expect(loadEditValues).not.toHaveBeenCalled();
  });

  it('skips async load when optimistic edit values are available', async () => {
    const loadEditValues = vi.fn(async () => ({ name: 'loaded' }));

    const { result } = renderHook(() =>
      useEntityFormRowReset({
        editId: 'row-1',
        createValues,
        loadEditValues,
        getOptimisticEditValues: () => ({ name: 'seed' }),
      })
    );

    expect(result.current.resetValues).toEqual({ name: 'seed' });
    expect(result.current.isReady).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(loadEditValues).not.toHaveBeenCalled();
  });
});
