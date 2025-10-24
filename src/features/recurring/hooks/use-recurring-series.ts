'use client';

import { QUERY_STALE_TIMES, queryKeys, RecurringTransactionSeries, recurringTransactionService } from '@/src/lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

// Mutation hooks
export const useCreateRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (series: Omit<RecurringTransactionSeries, 'id'>) =>
      recurringTransactionService.create(series),
    onSuccess: () => {
      // invalidate all recurring series related caches (active, upcoming, stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useUpdateRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransactionSeries> }) =>
      recurringTransactionService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useDeleteRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const usePauseRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; pauseUntil?: Date }) =>
      recurringTransactionService.pause(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useResumeRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionService.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useExecuteRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionService.execute(id),
    onSuccess: (_, id) => {
      // Invalidate both recurring series and transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

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
