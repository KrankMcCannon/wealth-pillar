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
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!reconciliation) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-muted-foreground">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <p className="font-medium text-foreground">Errore nel caricamento dei dati di riconciliazione</p>
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
        title={`Riconciliazione: ${series.description}`}
        subtitle={`Storico delle esecuzioni e pagamenti effettuati`}
        className="mb-6"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${isHealthy ? 'bg-primary/10 border-primary/20' : 'bg-warning/10 border-warning/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isHealthy ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            <span className={`font-medium ${isHealthy ? 'text-primary' : 'text-warning'}`}>
              Stato Serie
            </span>
          </div>
          <div className={`text-2xl font-bold ${isHealthy ? 'text-primary' : 'text-warning'}`}>
            {successRate.toFixed(1)}%
          </div>
          <div className={`text-sm ${isHealthy ? 'text-primary' : 'text-warning'}`}>
            Tasso di successo
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Esecuzioni</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {summary.actualExecutions}/{summary.expectedExecutions}
          </div>
          <div className="text-sm text-primary">
            Effettuate/Previste
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary/70" />
            <span className="font-medium text-primary">Importo Totale</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="text-sm text-primary/70">
            Pagato finora
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="font-medium text-destructive">Problemi Rilevati</span>
          </div>
          <ul className="text-sm text-destructive space-y-1">
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
              <h3 className="font-semibold text-primary border-b border-primary/20 pb-2">Riepilogo Finanziario</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Importo per esecuzione:</span>
                  <span className="font-semibold">{formatCurrency(series.amount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Esecuzioni previste:</span>
                  <span className="font-semibold">{summary.expectedExecutions}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Totale previsto:</span>
                  <span className="font-semibold">{formatCurrency(summary.expectedTotal)}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Esecuzioni effettuate:</span>
                  <span className="font-semibold text-primary">{summary.actualExecutions}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Totale pagato:</span>
                  <span className="font-semibold text-primary">{formatCurrency(summary.totalPaid)}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Differenza:</span>
                  <span className={`font-semibold ${
                    summary.difference === 0 ? 'text-accent' :
                    summary.difference > 0 ? 'text-warning' : 'text-destructive'
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
              <h3 className="font-semibold text-primary border-b border-primary/20 pb-2">Timeline Esecuzioni</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Prima esecuzione:</span>
                  <span className="font-semibold">
                    {transactions.length > 0
                      ? new Date(transactions[transactions.length - 1].date).toLocaleDateString('it-IT')
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Prossima prevista:</span>
                  <span className="font-semibold text-primary">
                    {new Date(series.due_date).toLocaleDateString('it-IT')}
                  </span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-primary/70">Frequenza:</span>
                  <span className="font-semibold">{series.frequency}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary">Transazioni Generate</h3>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {transactions.length} transazioni
              </Badge>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-accent/10' : 'bg-destructive/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-accent" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-primary">{transaction.description}</div>
                          <div className="text-sm text-primary/70">
                            {new Date(transaction.date).toLocaleDateString('it-IT')} • {transaction.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-accent' : 'text-destructive'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-primary/70">
                          ID: {transaction.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-primary/70">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-primary/30" />
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
