import React, { useMemo, useState, memo, useCallback } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { usePersonFilter } from '../../hooks/usePersonFilter';
import { useTransactionFilter } from '../../hooks/useDataFilters';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { SummaryCards } from '../ui/SummaryCards';
import { TransactionType } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../constants';

/**
 * Hook per gestire la logica dei report annuali
 * Principio SRP: Single Responsibility - gestisce solo i calcoli dei report
 */
const useAnnualReports = (selectedPersonId: string, selectedYear: number) => {
  const { getEffectiveTransactionAmount } = useFinance();
  const { transactions } = useTransactionFilter(selectedPersonId);

  const yearlyTransactions = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedYear]);

  const annualSummary = useMemo(() => {
    return yearlyTransactions
      .filter(tx => tx.category !== 'trasferimento') // Esclude i trasferimenti dai report
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
 */
const useYearSelection = (transactions: any[]) => {
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

/**
 * Componente per la selezione dell'anno
 * Principio SRP: Single Responsibility - gestisce solo il selector dell'anno
 */
const YearSelector = memo<{
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}>(({ availableYears, selectedYear, onYearChange }) => (
  <div>
    <label htmlFor="year-select" className="sr-only">Seleziona anno</label>
    <select
      id="year-select"
      value={selectedYear}
      onChange={(e) => onYearChange(Number(e.target.value))}
      className="p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
    </select>
  </div>
));

YearSelector.displayName = 'YearSelector';

/**
 * Componente per il grafico mensile
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione del grafico
 */
const MonthlyChart = memo<{
  data: any[];
  hasData: boolean;
  year: number;
}>(({ data, hasData, year }) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dettaglio mensile</h2>
    {hasData ? (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              borderColor: '#4b5563',
              color: '#f3f4f6'
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
          <Bar dataKey="entrata" fill="#22c55e" name="Entrata" />
          <Bar dataKey="spesa" fill="#ef4444" name="Spesa" />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-10">
        Nessuna transazione registrata per il {year}.
      </p>
    )}
  </Card>
));

MonthlyChart.displayName = 'MonthlyChart';

/**
 * Pagina Report ottimizzata
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei report
 * Principio DRY: Don't Repeat Yourself - usa componenti riutilizzabili
 * Principio OCP: Open/Closed - estendibile per nuovi tipi di report
 */
const ReportsPage = memo(() => {
  const { transactions } = useFinance();
  const { selectedPersonId, selectedPerson } = usePersonFilter();
  
  const { availableYears, selectedYear, setSelectedYear } = useYearSelection(transactions);
  const { annualSummary, monthlyData, netBalance, yearlyTransactions } = useAnnualReports(selectedPersonId, selectedYear);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
  }, [setSelectedYear]);

  // Configurazione delle cards di riepilogo
  const summaryCardsData = useMemo(() => [
    {
      title: 'Entrate totali',
      value: formatCurrency(annualSummary.entrata),
      color: 'green' as 'green',
    },
    {
      title: 'Spese totali',
      value: formatCurrency(annualSummary.spesa),
      color: 'red' as 'red',
    },
    {
      title: 'Saldo netto',
      value: formatCurrency(netBalance),
      color: netBalance >= 0 ? 'blue' as 'blue' : 'yellow' as 'yellow',
    },
  ], [annualSummary, netBalance]);

  const pageTitle = selectedPerson 
    ? `Report finanziario di ${selectedPerson.name}` 
    : 'Report finanziario generale';

  return (
    <div className="space-y-8">
      <PageHeader title={pageTitle}>
        <YearSelector
          availableYears={availableYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />
      </PageHeader>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Panoramica annuale - {selectedYear}
        </h2>
        <SummaryCards cards={summaryCardsData} />
      </Card>

      <MonthlyChart
        data={monthlyData}
        hasData={yearlyTransactions.length > 0}
        year={selectedYear}
      />
    </div>
  );
});

ReportsPage.displayName = 'ReportsPage';

export { ReportsPage };