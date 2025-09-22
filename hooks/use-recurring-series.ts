'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringTransactionSeriesService } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { RecurringTransactionSeries } from '@/lib/types';

// Basic CRUD hooks for RecurringTransactionSeries
export const useRecurringSeries = () => {
  return useQuery({
    queryKey: queryKeys.recurringSeries(),
    queryFn: recurringTransactionSeriesService.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRecurringSeriesById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesById(id),
    queryFn: () => recurringTransactionSeriesService.getById(id),
    enabled: !!id,
  });
};

export const useRecurringSeriesByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesByUser(userId),
    queryFn: () => recurringTransactionSeriesService.getByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useActiveRecurringSeries = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeRecurringSeries(userId),
    queryFn: () => recurringTransactionSeriesService.getActive(userId),
    staleTime: 30 * 1000, // 30 seconds for active series
  });
};

export const useUpcomingRecurringSeries = (days: number, userId?: string) => {
  return useQuery({
    queryKey: queryKeys.upcomingRecurringSeries(days, userId),
    queryFn: () => recurringTransactionSeriesService.getDueWithinDays(days, userId),
    staleTime: 30 * 1000,
  });
};

// Mutation hooks
export const useCreateRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (series: Omit<RecurringTransactionSeries, 'id'>) =>
      recurringTransactionSeriesService.create(series),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useUpdateRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransactionSeries> }) =>
      recurringTransactionSeriesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useDeleteRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionSeriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const usePauseRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pauseUntil }: { id: string; pauseUntil?: Date }) =>
      recurringTransactionSeriesService.pause(id, pauseUntil),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useResumeRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionSeriesService.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    },
  });
};

export const useExecuteRecurringSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringTransactionSeriesService.execute(id),
    onSuccess: (_, id) => {
      // Invalidate both recurring series and transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeriesById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
    },
  });
};

// Statistics and analytics hooks
export const useRecurringSeriesStats = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.recurringSeriesStats(userId),
    queryFn: async () => {
      const series = await recurringTransactionSeriesService.getActive(userId);

      const stats = {
        totalActiveSeries: series.length,
        totalExpenseSeries: series.filter(s => s.type === 'expense').length,
        totalIncomeSeries: series.filter(s => s.type === 'income').length,
        totalMonthlyImpact: series.reduce((sum, s) => {
          // Convert all frequencies to monthly equivalent
          let monthlyAmount = s.amount;
          switch (s.frequency) {
            case 'weekly':
              monthlyAmount = s.amount * 4.33; // Average weeks per month
              break;
            case 'biweekly':
              monthlyAmount = s.amount * 2.17; // Average biweeks per month
              break;
            case 'yearly':
              monthlyAmount = s.amount / 12;
              break;
            // monthly stays as is
          }
          return sum + (s.type === 'expense' ? -monthlyAmount : monthlyAmount);
        }, 0),
        averageAmount: series.length > 0 ? series.reduce((sum, s) => sum + s.amount, 0) / series.length : 0,
        nextDueDateSeries: series
          .filter(s => s.next_due_date)
          .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
          .slice(0, 3),
      };

      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};