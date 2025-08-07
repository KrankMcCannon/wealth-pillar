/**
 * Supabase React Hook
 * Provides easy access to repositories with React integration
 */

import { useCallback, useEffect, useState } from 'react';
import {
  accountRepository,
  AuthError,
  authService,
  budgetRepository,
  categoryRepository,
  personRepository,
  RepositoryError,
  transactionRepository
} from '../index';

// Generic hook for repository operations
export function useSupabaseRepository<T>(
  repositoryFn: () => any,
  autoLoad: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repository = repositoryFn();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await repository.findAll();
      setData(result);
    } catch (err) {
      if (err instanceof RepositoryError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [repository]);

  const create = useCallback(async (entity: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const result = await repository.create(entity);
      setData(prev => [result, ...prev]);
      return result;
    } catch (err) {
      if (err instanceof RepositoryError) {
        setError(err.message);
      } else {
        setError('Failed to create entity');
      }
      throw err;
    }
  }, [repository]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      setError(null);
      const result = await repository.update(id, updates);
      setData(prev => prev.map(item => (item as any).id === id ? result : item));
      return result;
    } catch (err) {
      if (err instanceof RepositoryError) {
        setError(err.message);
      } else {
        setError('Failed to update entity');
      }
      throw err;
    }
  }, [repository]);

  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      await repository.delete(id);
      setData(prev => prev.filter(item => (item as any).id !== id));
      return true;
    } catch (err) {
      if (err instanceof RepositoryError) {
        setError(err.message);
      } else {
        setError('Failed to delete entity');
      }
      throw err;
    }
  }, [repository]);

  const subscribe = useCallback(() => {
    return repository.subscribe((newData: T[]) => {
      setData(newData);
    });
  }, [repository]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    create,
    update,
    remove,
    subscribe
  };
}

// Specific hooks for each entity
export function useTransactions(autoLoad: boolean = true) {
  return useSupabaseRepository(transactionRepository, autoLoad);
}

export function useAccounts(autoLoad: boolean = true) {
  return useSupabaseRepository(accountRepository, autoLoad);
}

export function usePeople(autoLoad: boolean = true) {
  return useSupabaseRepository(personRepository, autoLoad);
}

export function useBudgets(autoLoad: boolean = true) {
  return useSupabaseRepository(budgetRepository, autoLoad);
}

export function useCategories(autoLoad: boolean = true) {
  return useSupabaseRepository(categoryRepository, autoLoad);
}

// Auth hook
export function useSupabaseAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = authService();

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const result = await auth.signIn(email, password);
      return result;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Sign in failed');
      }
      throw err;
    }
  }, [auth]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const result = await auth.signUp(email, password);
      return result;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Sign up failed');
      }
      throw err;
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await auth.signOut();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Sign out failed');
      }
      throw err;
    }
  }, [auth]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await auth.resetPassword(email);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Password reset failed');
      }
      throw err;
    }
  }, [auth]);

  useEffect(() => {
    // Get initial user
    auth.getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to get current user:', err);
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = auth.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  };
}

// Real-time hooks
export function useRealtimeTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    const unsubscribe = transactionRepository().subscribe((data) => {
      setTransactions(data);
    });

    return unsubscribe;
  }, []);

  return transactions;
}

export function useRealtimeAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  
  useEffect(() => {
    const unsubscribe = accountRepository().subscribe((data) => {
      setAccounts(data);
    });

    return unsubscribe;
  }, []);

  return accounts;
}
