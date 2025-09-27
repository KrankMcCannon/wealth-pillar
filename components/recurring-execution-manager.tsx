'use client';

import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionHeader } from './section-header';
import { formatCurrency } from '@/lib/utils';
import {
  useExecuteAllDueSeries,
  useDryRunExecution,
  useMissedExecutions,
  useUpcomingRecurringSeries
} from '@/hooks';
import type { ExecutionResult } from '@/lib/recurring-execution-service';

interface RecurringExecutionManagerProps {
  selectedUserId?: string;
  className?: string;
}

export function RecurringExecutionManager({
  selectedUserId = 'all',
  className = ''
}: RecurringExecutionManagerProps) {
  const [lastExecutionResult, setLastExecutionResult] = useState<{
    type: 'dry-run' | 'execution';
    result: ExecutionResult;
  } | null>(null);

  // Hooks
  const executeAllMutation = useExecuteAllDueSeries();
  const dryRunMutation = useDryRunExecution();
  const { data: upcomingSeries = [] } = useUpcomingRecurringSeries(0, selectedUserId !== 'all' ? selectedUserId : undefined);
  const { data: missedExecutions = [] } = useMissedExecutions();

  // Filter for today's due series
  const todayDueSeries = upcomingSeries.filter(series => {
    const nextDue = new Date(series.due_date);
    const today = new Date();
    const diffDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 0;
  });

  const overdueSeries = upcomingSeries.filter(series => {
    const nextDue = new Date(series.due_date);
    const today = new Date();
    const diffDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0;
  });

  const handleDryRun = async () => {
    try {
      const result = await dryRunMutation.mutateAsync({
        maxDaysOverdue: 7
      });
      setLastExecutionResult({
        type: 'dry-run',
        result
      });
    } catch (error) {
      console.error('Dry run failed:', error);
    }
  };

  const handleExecuteAll = async () => {
    try {
      const result = await executeAllMutation.mutateAsync({
        maxDaysOverdue: 7
      });
      setLastExecutionResult({
        type: 'execution',
        result
      });
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const totalDueAmount = todayDueSeries.reduce((sum, series) => {
    return sum + (series.type === 'expense' ? -series.amount : series.amount);
  }, 0);

  // Removed unused variable totalOverdueAmount

  if (todayDueSeries.length === 0 && overdueSeries.length === 0 && missedExecutions.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <SectionHeader
          title="Esecuzione Automatica"
          subtitle="Nessuna transazione in scadenza oggi"
          className="mb-4"
        />
        <div className="text-center py-8 text-slate-500">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-medium text-slate-900">Tutte le transazioni sono aggiornate</p>
          <p className="text-sm mt-1">
            Non ci sono serie ricorrenti da eseguire oggi
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        title="Esecuzione Automatica"
        subtitle="Gestisci l'esecuzione delle transazioni ricorrenti"
        className="mb-6"
      />

      {/* Today's Due Series */}
      {todayDueSeries.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7578EC]" />
              In Scadenza Oggi
            </h3>
            <Badge variant="outline" className="bg-[#7578EC]/10 text-[#7578EC] border-[#7578EC]/30">
              {todayDueSeries.length} serie
            </Badge>
          </div>

          <div className="grid gap-3 mb-4">
            {todayDueSeries.map((series) => (
              <div key={series.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{series.description}</div>
                  <div className="text-sm text-gray-600">{series.description}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${series.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(series.amount)}
                  </div>
                  <div className="text-xs text-gray-500">{series.frequency}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border border-blue-300">
            <span className="font-semibold text-blue-900">Impatto Totale:</span>
            <span className={`font-bold text-lg ${totalDueAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalDueAmount))}
            </span>
          </div>
        </div>
      )}

      {/* Overdue Series */}
      {overdueSeries.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              In Ritardo
            </h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {overdueSeries.length} serie
            </Badge>
          </div>

          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Ci sono {overdueSeries.length} serie ricorrenti in ritardo che dovrebbero essere eseguite.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3 mb-4">
            {overdueSeries.slice(0, 3).map((series) => {
              const nextDue = new Date(series.due_date);
              const today = new Date();
              const daysOverdue = Math.abs(Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={series.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{series.description}</div>
                    <div className="text-sm text-red-600">{daysOverdue} giorni in ritardo</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${series.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(series.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {overdueSeries.length > 3 && (
            <div className="text-sm text-gray-600 mb-4">
              ... e altre {overdueSeries.length - 3} serie in ritardo
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={handleDryRun}
          disabled={dryRunMutation.isPending}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {dryRunMutation.isPending ? 'Simulando...' : 'Simula Esecuzione'}
        </Button>

        <Button
          onClick={handleExecuteAll}
          disabled={executeAllMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="w-4 h-4" />
          {executeAllMutation.isPending ? 'Eseguendo...' : 'Esegui Tutte'}
        </Button>
      </div>

      {/* Execution Result */}
      {lastExecutionResult && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            {lastExecutionResult.type === 'dry-run' ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {lastExecutionResult.type === 'dry-run' ? 'Risultato Simulazione' : 'Risultato Esecuzione'}
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {lastExecutionResult.result.summary.totalProcessed}
              </div>
              <div className="text-gray-600">Serie Processate</div>
            </div>
            <div>
              <div className="font-medium text-green-600">
                {lastExecutionResult.result.summary.successfulExecutions}
              </div>
              <div className="text-gray-600">Successi</div>
            </div>
            <div>
              <div className="font-medium text-red-600">
                {lastExecutionResult.result.summary.failedExecutions}
              </div>
              <div className="text-gray-600">Fallimenti</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">
                {formatCurrency(Math.abs(lastExecutionResult.result.summary.totalAmount))}
              </div>
              <div className="text-gray-600">Importo Totale</div>
            </div>
          </div>

          {lastExecutionResult.result.failed.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-red-700 mb-2">Esecuzioni Fallite:</h5>
              <div className="space-y-2">
                {lastExecutionResult.result.failed.map((failure, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="font-medium">{failure.seriesName}:</span>
                    <span className="text-red-600">{failure.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default RecurringExecutionManager;
