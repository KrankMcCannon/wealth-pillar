import { useMemo, useState } from 'react';
import { CategoryUtils } from '../../../lib/utils/category.utils';
import { TransactionType } from '../../../types';
import { useFinance } from '../../core/useFinance';
import { useTransactionFilter } from '../../data/useDataFilters';

/**
 * Hook per gestire la logica dei report annuali
 * Principio SRP: Single Responsibility - gestisce solo i calcoli dei report
 * Principio DRY: Don't Repeat Yourself - centralizza la logica di analisi
 */
export const useAnnualReports = (selectedPersonId: string, selectedYear: number) => {
  const { getEffectiveTransactionAmount } = useFinance();
  const { transactions } = useTransactionFilter(selectedPersonId);

  // Filtra le transazioni per l'anno selezionato
  const yearlyTransactions = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedYear]);

  // Calcola il riepilogo annuale
  const annualSummary = useMemo(() => {
    return yearlyTransactions
      .filter(tx => !CategoryUtils.isTransfer(tx)) // Esclude i trasferimenti dai report
      .reduce((acc, tx) => {
        const effectiveAmount = getEffectiveTransactionAmount(tx);
        if (tx.type === TransactionType.ENTRATA) {
          acc.entrata += effectiveAmount;
        } else {
          acc.spesa += effectiveAmount;
        }
        return acc;
      }, { entrata: 0, spesa: 0 });
  }, [yearlyTransactions, getEffectiveTransactionAmount]);

  // Calcola i dati mensili per il grafico
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return months.map(monthIndex => {
      const monthName = new Date(0, monthIndex).toLocaleString('it-IT', { month: 'short' });
      const monthTransactions = yearlyTransactions.filter(t => new Date(t.date).getMonth() === monthIndex);

      const totals = monthTransactions.reduce((acc, tx) => {
        const effectiveAmount = getEffectiveTransactionAmount(tx);
        if (tx.type === TransactionType.ENTRATA) {
          acc.entrata += effectiveAmount;
        } else {
          acc.spesa += effectiveAmount;
        }
        return acc;
      }, { entrata: 0, spesa: 0 });

      return {
        name: monthName,
        ...totals
      };
    });
  }, [yearlyTransactions, getEffectiveTransactionAmount]);

  const netBalance = annualSummary.entrata - annualSummary.spesa;

  return {
    yearlyTransactions,
    annualSummary,
    monthlyData,
    netBalance,
  };
};

/**
 * Hook per gestire la selezione degli anni disponibili
 * Principio SRP: Single Responsibility - gestisce solo la logica degli anni
 * Principio DRY: Don't Repeat Yourself - riutilizzabile per altre analisi temporali
 */
export const useYearSelection = (transactions: any[]) => {
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());

  return {
    availableYears,
    selectedYear,
    setSelectedYear,
  };
};
