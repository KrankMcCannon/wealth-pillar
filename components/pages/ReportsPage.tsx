import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnnualReports, useFinance, usePersonFilter, useYearSelection } from '../../hooks';
import { Card, PageHeader, SummaryCards } from '../ui';
import { formatCurrency } from '../../constants';

/**
 * Componente per la selezione dell'anno
 * Principio SRP: Single Responsibility - gestisce solo il selector dell'anno
 */
const YearSelector = memo<{
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}>(({ availableYears, selectedYear, onYearChange }) => (
  <Card>
    <div className="p-4">
      <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Seleziona Anno
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {availableYears.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  </Card>
));

YearSelector.displayName = 'YearSelector';

/**
 * Componente per il grafico mensile
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione del grafico
 */
const MonthlyChart = memo<{
  data: Array<{ name: string; entrata: number; spesa: number }>;
  selectedPersonId: string;
}>(({ data, selectedPersonId }) => (
  <Card>
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Trend Mensile {new Date().getFullYear()}
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'entrata' ? 'Entrate' : 'Spese'
              ]}
              labelStyle={{ color: 'var(--text-primary)' }}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px'
              }}
            />
            <Legend 
              formatter={(value) => value === 'entrata' ? 'Entrate' : 'Spese'}
            />
            <Bar 
              dataKey="entrata" 
              fill="#10B981" 
              name="entrata"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="spesa" 
              fill="#EF4444" 
              name="spesa"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </Card>
));

MonthlyChart.displayName = 'MonthlyChart';

/**
 * Pagina Report ottimizzata
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei report
 * Principio OCP: Open/Closed - estendibile per nuovi tipi di report
 * Principio DRY: Don't Repeat Yourself - usa hook centralizzati e componenti riutilizzabili
 */
export const ReportsPage = memo(() => {
  const { selectedPersonId, selectedPerson } = usePersonFilter();
  const { transactions } = useFinance();
  const { availableYears, selectedYear, setSelectedYear } = useYearSelection(transactions);
  const { yearlyTransactions, annualSummary, monthlyData, netBalance } = useAnnualReports(
    selectedPersonId, 
    selectedYear
  );

  const summaryCardsData = [
    {
      title: 'Entrate Totali',
      value: formatCurrency(annualSummary.entrata),
      change: undefined,
      trend: 'up' as const,
      color: 'green'
    },
    {
      title: 'Spese Totali',
      value: formatCurrency(annualSummary.spesa),
      change: undefined,
      trend: 'down' as const,
      color: 'red'
    },
    {
      title: 'Bilancio Netto',
      value: formatCurrency(netBalance),
      change: undefined,
      trend: netBalance >= 0 ? 'up' as const : 'down' as const,
      color: netBalance >= 0 ? 'green' : 'red'
    },
    {
      title: 'Transazioni',
      value: yearlyTransactions.length.toString(),
      change: undefined,
      trend: 'neutral' as const,
      color: 'blue'
    }
  ];

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Report Finanziari${selectedPerson ? ` - ${selectedPerson.name}` : ''}`}
        subtitle={`Anno ${selectedYear}`}
      />

      <YearSelector
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
      />

      <SummaryCards cards={summaryCardsData} />

      <MonthlyChart
        data={monthlyData}
        selectedPersonId={selectedPersonId}
      />
    </div>
  );
});

ReportsPage.displayName = 'ReportsPage';
