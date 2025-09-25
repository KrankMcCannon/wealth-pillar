/**
 * Recurring Execution Service
 *
 * Gestisce l'esecuzione automatica delle transazioni ricorrenti.
 */
import { recurringTransactionService, transactionService } from './api-client';
import type { RecurringTransactionSeries, Transaction } from './types';

export interface ExecutionResult {
  executed: Transaction[];
  failed: Array<{
    seriesId: string;
    seriesName: string;
    error: string;
  }>;
  summary: {
    totalProcessed: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalAmount: number;
  };
}

export interface ExecutionOptions {
  dryRun?: boolean; // Se true, simula l'esecuzione senza creare transazioni
  forceExecute?: boolean; // Se true, esegue anche serie non in auto_execute
  maxDaysOverdue?: number; // Massimo numero di giorni di ritardo per l'esecuzione
}

class RecurringExecutionService {
  /**
   * Esegue tutte le serie ricorrenti in scadenza
   */
  async executeAllDue(options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const {
      dryRun = false,
      forceExecute = false,
      maxDaysOverdue = 7
    } = options;

    const result: ExecutionResult = {
      executed: [],
      failed: [],
      summary: {
        totalProcessed: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalAmount: 0
      }
    };

    try {
      // Ottieni tutte le serie attive
      const activeSeries = await recurringTransactionService.getActive();

      // Filtra le serie che sono in scadenza o in ritardo
      const dueSeries = activeSeries.filter((series: RecurringTransactionSeries) => {
        const nextDue = new Date(series.next_due_date);
        const now = new Date();
        const daysDiff = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Includi serie che sono in scadenza oggi o in ritardo (ma non oltre maxDaysOverdue)
        return daysDiff <= 0 && daysDiff >= -maxDaysOverdue;
      });

      // Filtra per auto_execute se non è forceExecute
      const seriesToExecute = forceExecute
        ? dueSeries
        : dueSeries.filter((series: RecurringTransactionSeries) => series.auto_execute);

      result.summary.totalProcessed = seriesToExecute.length;

      // Esegui ogni serie
      for (const series of seriesToExecute) {
        try {
          if (dryRun) {
            console.log(`[DRY RUN] Would execute series: ${series.name} (${series.id})`);
            result.summary.successfulExecutions++;
            result.summary.totalAmount += series.amount;
          } else {
            const transaction = await this.executeSeries(series);
            result.executed.push(transaction);
            result.summary.successfulExecutions++;
            result.summary.totalAmount += series.amount;
          }
        } catch (error) {
          result.failed.push({
            seriesId: series.id,
            seriesName: series.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          result.summary.failedExecutions++;

          // Aggiorna il conteggio dei fallimenti nella serie
          if (!dryRun) {
            try {
              await recurringTransactionService.update(series.id, {
                failed_executions: series.failed_executions + 1
              });
            } catch (updateError) {
              console.error(`Failed to update failed_executions for series ${series.id}:`, updateError);
            }
          }
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to execute recurring series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Esegue una singola serie ricorrente
   */
  private async executeSeries(series: RecurringTransactionSeries): Promise<Transaction> {
    try {
      // Verifica che la serie sia ancora attiva e non in pausa
      if (!series.is_active || series.is_paused) {
        throw new Error(`Series ${series.name} is not active or is paused`);
      }

      // Crea la transazione
      const nowIso = new Date().toISOString();
      const transaction = await transactionService.create({
        description: series.description,
        amount: series.amount,
        type: series.type,
        category: series.category,
        date: nowIso,
        user_id: series.user_id,
        account_id: series.account_id,
        to_account_id: series.to_account_id,
        recurring_series_id: series.id, // IMPORTANTE: collegamento per riconciliazione
        group_id: series.group_id,
        frequency: series.frequency,
      });

      // Calcola la prossima data di scadenza
      const nextDueDate = this.calculateNextDueDate(series);

      // Aggiorna la serie con i nuovi dati di esecuzione
      await recurringTransactionService.update(series.id, {
        last_executed_date: nowIso,
        total_executions: series.total_executions + 1,
        next_due_date: nextDueDate.toISOString(),
      });

      return transaction;
    } catch (error) {
      throw new Error(`Failed to execute series ${series.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calcola la prossima data di scadenza basata sulla frequenza
   */
  private calculateNextDueDate(series: RecurringTransactionSeries): Date {
    const currentDue = new Date(series.next_due_date);
    const nextDate = new Date(currentDue);

    switch (series.frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        // Per i pagamenti mensili, mantieni il giorno del mese se specificato
        if (series.day_of_month) {
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(series.day_of_month);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'yearly':
        // Per i pagamenti annuali, mantieni il giorno e mese se specificati
        if (series.day_of_month && series.month_of_year) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          nextDate.setMonth(series.month_of_year - 1); // Month is 0-indexed
          nextDate.setDate(series.day_of_month);
        } else {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        break;
      default:
        throw new Error(`Unsupported frequency: ${series.frequency}`);
    }

    return nextDate;
  }

  /**
   * Ottieni tutte le transazioni create da una serie specifica (riconciliazione)
   */
  async getTransactionsBySeries(seriesId: string): Promise<Transaction[]> {
    try {
      const allTransactions = await transactionService.getAll();
      return allTransactions.filter(transaction =>
        transaction.recurring_series_id === seriesId
      );
    } catch (error) {
      throw new Error(`Failed to get transactions for series ${seriesId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ottieni statistiche di riconciliazione per una serie
   */
  async getSeriesReconciliation(seriesId: string) {
    try {
      const [series, transactions] = await Promise.all([
        recurringTransactionService.getById(seriesId),
        this.getTransactionsBySeries(seriesId)
      ]);

      const totalPaid = transactions.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
      const expectedAmount = series.amount * series.total_executions;
      const missedPayments = series.total_executions - transactions.length;

      return {
        series,
        transactions,
        summary: {
          expectedExecutions: series.total_executions,
          actualExecutions: transactions.length,
          missedPayments,
          totalPaid,
          expectedTotal: expectedAmount,
          difference: totalPaid - expectedAmount,
          successRate: series.total_executions > 0
            ? (transactions.length / series.total_executions) * 100
            : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to get reconciliation for series ${seriesId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica quali serie hanno transazioni mancanti
   */
  async findMissedExecutions() {
    try {
      const activeSeries = await recurringTransactionService.getActive();
      const missedSeries = [];

      for (const series of activeSeries) {
        const reconciliation = await this.getSeriesReconciliation(series.id);
        if (reconciliation.summary.missedPayments > 0) {
          missedSeries.push({
            series,
            missedCount: reconciliation.summary.missedPayments
          });
        }
      }

      return missedSeries;
    } catch (error) {
      throw new Error(`Failed to find missed executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const recurringExecutionService = new RecurringExecutionService();

// Utility function per testing locale
export const executeDueRecurringSeries = async (options?: ExecutionOptions) => {
  return recurringExecutionService.executeAllDue(options);
};

export default recurringExecutionService;