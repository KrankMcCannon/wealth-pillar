import { useCallback, useState } from 'react';

/**
 * Interfaccia per lo stato delle operazioni asincrone
 */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook generico per gestire operazioni asincrone
 * Principio SRP: Single Responsibility - gestisce solo lo stato asincrono
 * Principio DRY: Don't Repeat Yourself - riutilizzabile per qualsiasi operazione async
 */
export const useAsync = <T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async (...args: Args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction(...args);
      setState({ data, loading: false, error: null });
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore';
      setState({ data: null, loading: false, error: errorMessage });
      return { data: null, error: errorMessage };
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

/**
 * Hook per gestire operazioni CRUD generiche
 * Principio SRP: Single Responsibility - gestisce operazioni CRUD
 * Principio DRY: Don't Repeat Yourself - pattern comune per operazioni CRUD
 */
export const useCrud = <T, CreateData = Partial<T>, UpdateData = Partial<T>>(
  operations: {
    create?: (data: CreateData) => Promise<T>;
    read?: (id: string) => Promise<T>;
    update?: (id: string, data: UpdateData) => Promise<T>;
    delete?: (id: string) => Promise<void>;
    list?: () => Promise<T[]>;
  }
) => {
  const createAsync = useAsync(operations.create || (() => Promise.reject('Create not implemented')));
  const readAsync = useAsync(operations.read || (() => Promise.reject('Read not implemented')));
  const updateAsync = useAsync(operations.update || (() => Promise.reject('Update not implemented')));
  const deleteAsync = useAsync(operations.delete || (() => Promise.reject('Delete not implemented')));
  const listAsync = useAsync(operations.list || (() => Promise.reject('List not implemented')));

  return {
    create: createAsync,
    read: readAsync,
    update: updateAsync,
    delete: deleteAsync,
    list: listAsync,
  };
};

/**
 * Hook per gestire lo stato di loading globale
 * Principio SRP: Single Responsibility - gestisce solo lo stato di loading
 */
export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      if (loading) {
        newMap.set(key, true);
      } else {
        newMap.delete(key);
      }
      return newMap;
    });
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates.has(key);
    }
    return loadingStates.size > 0;
  }, [loadingStates]);

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    } else {
      setLoadingStates(new Map());
    }
  }, []);

  return {
    setLoading,
    isLoading,
    clearLoading,
    loadingKeys: Array.from(loadingStates.keys()),
  };
};
