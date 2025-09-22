'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from './section-header';
import { formatCurrency } from '@/lib/utils';
import { useSeriesReconciliation, useSeriesTransactions } from '@/hooks';
import type { RecurringTransactionSeries } from '@/lib/types';

interface SeriesReconciliationViewProps {
  series: RecurringTransactionSeries;
  className?: string;
}

export function SeriesReconciliationView({
  series,
  className = ''
}: SeriesReconciliationViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  const {
    data: reconciliation,
    isLoading: reconciliationLoading
  } = useSeriesReconciliation(series.id);

  const {
    data: transactions = [],
    isLoading: transactionsLoading
  } = useSeriesTransactions(series.id);

  const isLoading = reconciliationLoading || transactionsLoading;

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!reconciliation) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-slate-500">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="font-medium text-slate-900">Errore nel caricamento dei dati di riconciliazione</p>
        </div>
      </Card>
    );
  }

  const { summary } = reconciliation;
  const successRate = summary.successRate;
  const isHealthy = successRate >= 95;
  const hasIssues = summary.missedPayments > 0 || summary.difference !== 0;

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        title={`Riconciliazione: ${series.name}`}
        subtitle={`Storico delle esecuzioni e pagamenti effettuati`}
        className="mb-6"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${isHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isHealthy ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <span className={`font-medium ${isHealthy ? 'text-green-800' : 'text-yellow-800'}`}>
              Stato Serie
            </span>
          </div>
          <div className={`text-2xl font-bold ${isHealthy ? 'text-green-700' : 'text-yellow-700'}`}>
            {successRate.toFixed(1)}%
          </div>
          <div className={`text-sm ${isHealthy ? 'text-green-600' : 'text-yellow-600'}`}>
            Tasso di successo
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Esecuzioni</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {summary.actualExecutions}/{summary.expectedExecutions}
          </div>
          <div className="text-sm text-blue-600">
            Effettuate/Previste
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-800">Importo Totale</span>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="text-sm text-gray-600">
            Pagato finora
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Problemi Rilevati</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {summary.missedPayments > 0 && (
              <li>• {summary.missedPayments} pagamenti mancanti</li>
            )}
            {summary.difference !== 0 && (
              <li>
                • Differenza di importo: {formatCurrency(Math.abs(summary.difference))}
                {summary.difference > 0 ? ' in eccesso' : ' in difetto'}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'transactions')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="transactions">
            Transazioni ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Riepilogo Finanziario</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Importo per esecuzione:</span>
                  <span className="font-semibold">{formatCurrency(series.amount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Esecuzioni previste:</span>
                  <span className="font-semibold">{summary.expectedExecutions}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Totale previsto:</span>
                  <span className="font-semibold">{formatCurrency(summary.expectedTotal)}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Esecuzioni effettuate:</span>
                  <span className="font-semibold text-blue-600">{summary.actualExecutions}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Totale pagato:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(summary.totalPaid)}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Differenza:</span>
                  <span className={`font-semibold ${
                    summary.difference === 0 ? 'text-green-600' :
                    summary.difference > 0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {summary.difference === 0 ? 'Nessuna' : formatCurrency(Math.abs(summary.difference))}
                    {summary.difference > 0 && ' (eccesso)'}
                    {summary.difference < 0 && ' (difetto)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Timeline Esecuzioni</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prima esecuzione:</span>
                  <span className="font-semibold">
                    {transactions.length > 0
                      ? new Date(transactions[transactions.length - 1].date).toLocaleDateString('it-IT')
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ultima esecuzione:</span>
                  <span className="font-semibold">
                    {series.last_executed_date
                      ? new Date(series.last_executed_date).toLocaleDateString('it-IT')
                      : 'Mai'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prossima prevista:</span>
                  <span className="font-semibold text-blue-600">
                    {new Date(series.next_due_date).toLocaleDateString('it-IT')}
                  </span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Frequenza:</span>
                  <span className="font-semibold">{series.frequency}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Esecuzioni fallite:</span>
                  <span className={`font-semibold ${series.failed_executions > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {series.failed_executions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Transazioni Generate</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {transactions.length} transazioni
              </Badge>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleDateString('it-IT')} • {transaction.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {transaction.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessuna transazione generata</p>
                <p className="text-sm mt-1">
                  Le transazioni generate da questa serie appariranno qui
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default SeriesReconciliationView;