'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseEntityFormRowResetOptions<T> {
  editId?: string | null | undefined;
  createValues: T;
  loadEditValues?: (editId: string, signal: AbortSignal) => Promise<T | null>;
  getEditValuesSync?: (editId: string) => T | undefined;
  getOptimisticEditValues?: (editId: string) => T | undefined;
  onLoadError?: (message: string | undefined) => void;
}

export interface UseEntityFormRowResetResult<T> {
  resetValues: T | undefined;
  isReady: boolean;
  isLoading: boolean;
}

type AsyncLoadState<T> = {
  editId: string;
  values?: T;
  failed?: boolean;
};

/**
 * Loads row values for entity form modals.
 * Create mode: resetValues tracks createValues directly.
 * Edit mode: loads async; optional optimistic values until fetch completes.
 */
export function useEntityFormRowReset<T>({
  editId,
  createValues,
  loadEditValues,
  getEditValuesSync,
  getOptimisticEditValues,
  onLoadError,
}: UseEntityFormRowResetOptions<T>): UseEntityFormRowResetResult<T> {
  const isEditMode = Boolean(editId);
  const syncValues = isEditMode && editId ? getEditValuesSync?.(editId) : undefined;
  const optimisticValues =
    isEditMode && editId && syncValues === undefined
      ? getOptimisticEditValues?.(editId)
      : undefined;

  const [asyncLoad, setAsyncLoad] = useState<AsyncLoadState<T> | null>(null);

  const loadEditValuesRef = useRef(loadEditValues);
  const onLoadErrorRef = useRef(onLoadError);

  useEffect(() => {
    loadEditValuesRef.current = loadEditValues;
    onLoadErrorRef.current = onLoadError;
  }, [loadEditValues, onLoadError]);

  useEffect(() => {
    if (!editId || syncValues !== undefined || !loadEditValuesRef.current) {
      return;
    }

    const controller = new AbortController();

    loadEditValuesRef
      .current(editId, controller.signal)
      .then((values) => {
        if (controller.signal.aborted) return;
        if (values) {
          setAsyncLoad({ editId, values });
          return;
        }
        onLoadErrorRef.current?.(undefined);
        setAsyncLoad({ editId, failed: true });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        onLoadErrorRef.current?.(undefined);
        setAsyncLoad({ editId, failed: true });
      });

    return () => {
      controller.abort();
    };
  }, [editId, syncValues]);

  if (!isEditMode) {
    return {
      resetValues: createValues,
      isReady: true,
      isLoading: false,
    };
  }

  if (syncValues !== undefined) {
    return {
      resetValues: syncValues,
      isReady: true,
      isLoading: false,
    };
  }

  const loadEntry = asyncLoad?.editId === editId ? asyncLoad : undefined;
  const loadedValues = loadEntry?.values;
  const loadFinished = loadEntry !== undefined;
  const resetValues = loadedValues ?? optimisticValues;

  return {
    resetValues,
    isReady: loadedValues !== undefined || optimisticValues !== undefined,
    isLoading: !loadFinished && Boolean(loadEditValues) && optimisticValues === undefined,
  };
}
