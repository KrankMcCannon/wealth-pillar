'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringExecutionService } from '@/lib/recurring-execution-service';
import { queryKeys } from '@/lib/query-keys';
import type { ExecutionOptions } from '@/lib/recurring-execution-service';

// Hook per eseguire tutte le serie in scadenza
export const useExecuteAllDueSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: ExecutionOptions) =>
      recurringExecutionService.executeAllDue(options),
    onSuccess: () => {
      // Invalidate all relevant queries after execution
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

// Hook per ottenere le transazioni di una serie specifica (riconciliazione)
export const useSeriesTransactions = (seriesId: string) => {
  return useQuery({
    queryKey: [...queryKeys.recurringSeries(), seriesId, 'transactions'],
    queryFn: () => recurringExecutionService.getTransactionsBySeries(seriesId),
    enabled: !!seriesId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook per ottenere i dati di riconciliazione di una serie
export const useSeriesReconciliation = (seriesId: string) => {
  return useQuery({
    queryKey: [...queryKeys.recurringSeries(), seriesId, 'reconciliation'],
    queryFn: () => recurringExecutionService.getSeriesReconciliation(seriesId),
    enabled: !!seriesId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook per simulare l'esecuzione (dry run)
export const useDryRunExecution = () => {
  return useMutation({
    mutationFn: (options?: ExecutionOptions) =>
      recurringExecutionService.executeAllDue({ ...options, dryRun: true }),
  });
};
