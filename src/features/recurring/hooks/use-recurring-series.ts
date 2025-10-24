'use client';

import { QUERY_STALE_TIMES, queryKeys, RecurringTransactionSeries, Transaction, updateRecurringSeriesInCache } from '@/src/lib';
import { recurringTransactionService } from '@/src/lib/api/client';
import { useGenericMutation } from '@/src/lib/hooks';
import { useQuery } from '@tanstack/react-query';

// Basic CRUD hooks for RecurringTransactionSeries
export const useRecurringSeries = () => {
  return useQuery({
    queryKey: queryKeys.recurringSeries(),
    queryFn: recurringTransactionService.getAll,
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};

export const useRecurringSeriesById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesById(id),
    queryFn: () => recurringTransactionService.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};

export const useRecurringSeriesByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesByUser(userId),
    queryFn: () => recurringTransactionService.getByUserId(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};

export const useActiveRecurringSeries = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeRecurringSeries(userId),
    queryFn: () => recurringTransactionService.getActive(userId),
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};

export const useUpcomingRecurringSeries = (days: number, userId?: string) => {
  return useQuery({
    queryKey: queryKeys.upcomingRecurringSeries(days, userId),
    queryFn: () => recurringTransactionService.getDueWithinDays(days, userId),
    staleTime: QUERY_STALE_TIMES.upcomingTransactions,
  });
};

// Mutation hooks (refactored with generic factory)

export const useCreateRecurringSeries = () =>
  useGenericMutation<RecurringTransactionSeries, Omit<RecurringTransactionSeries, 'id'>>(
    (series) => recurringTransactionService.create(series),
    {
      cacheKeys: () => [queryKeys.recurringSeries()],
      cacheUpdateFn: updateRecurringSeriesInCache,
      operation: 'create',
    }
  );

export const useUpdateRecurringSeries = () =>
  useGenericMutation<
    RecurringTransactionSeries,
    { id: string; data: Partial<RecurringTransactionSeries> }
  >(
    ({ id, data }) => recurringTransactionService.update(id, data),
    {
      cacheKeys: (vars) => [queryKeys.recurringSeries(), queryKeys.recurringSeriesById(vars.id)],
      cacheUpdateFn: updateRecurringSeriesInCache,
      operation: 'update',
    }
  );

export const useDeleteRecurringSeries = () =>
  useGenericMutation<void, string>(
    (id) => recurringTransactionService.delete(id),
    {
      cacheKeys: () => [queryKeys.recurringSeries()],
      cacheUpdateFn: () => {
        // Deletion handled by invalidation
      },
      operation: 'delete',
    }
  );

export const usePauseRecurringSeries = () =>
  useGenericMutation<RecurringTransactionSeries, { id: string; pauseUntil?: Date }>(
    ({ id }) => recurringTransactionService.pause(id),
    {
      cacheKeys: (vars) => [
        queryKeys.recurringSeries(),
        queryKeys.recurringSeriesById(vars.id),
        queryKeys.activeRecurringSeries(),
      ],
      cacheUpdateFn: updateRecurringSeriesInCache,
      operation: 'update',
    }
  );

export const useResumeRecurringSeries = () =>
  useGenericMutation<RecurringTransactionSeries, string>(
    (id) => recurringTransactionService.resume(id),
    {
      cacheKeys: (id) => [
        queryKeys.recurringSeries(),
        queryKeys.recurringSeriesById(id),
        queryKeys.activeRecurringSeries(),
      ],
      cacheUpdateFn: updateRecurringSeriesInCache,
      operation: 'update',
    }
  );

export const useExecuteRecurringSeries = () =>
  useGenericMutation<Transaction, string>(
    (id) => recurringTransactionService.execute(id),
    {
      cacheKeys: (id) => [queryKeys.recurringSeries(), queryKeys.recurringSeriesById(id)],
      cacheUpdateFn: () => {
        // Execution creates new transaction, invalidate all related
      },
      invalidateFn: (qc) => {
        // Invalidate all affected queries
        qc.invalidateQueries({ queryKey: queryKeys.transactions() });
        qc.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
        qc.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
        qc.invalidateQueries({ queryKey: queryKeys.financial() });
        qc.invalidateQueries({ queryKey: queryKeys.dashboard() });
      },
      operation: 'create',
    }
  );

// Statistics and analytics hooks
export const useRecurringSeriesStats = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesStats(userId),
    queryFn: () => recurringTransactionService.getStats(userId),
    staleTime: QUERY_STALE_TIMES.recurringStats,
  });
};

// New advanced analytics hooks
export const useRecurringSeriesDashboard = (userId?: string) => {
  return useQuery({
    queryKey: [...queryKeys.recurringSeries(), 'dashboard', userId].filter(Boolean),
    queryFn: () => recurringTransactionService.getDashboardData(userId),
    staleTime: QUERY_STALE_TIMES.recurringDashboard,
  });
};

export const useRecurringSeriesReconciliation = (seriesId: string) => {
  return useQuery({
    queryKey: [...queryKeys.recurringSeriesById(seriesId), 'reconciliation'],
    queryFn: () => recurringTransactionService.getReconciliation(seriesId),
    enabled: !!seriesId,
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};

export const useMissedExecutions = () => {
  return useQuery({
    queryKey: [...queryKeys.recurringSeries(), 'missed'],
    queryFn: () => recurringTransactionService.findMissedExecutions(),
    staleTime: QUERY_STALE_TIMES.recurringSeries,
  });
};
