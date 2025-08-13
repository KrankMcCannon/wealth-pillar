import React, { memo, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnnualReports, useFinance, usePersonFilter, useYearSelection } from '../../hooks';
import { Card, PageHeader, SummaryCards } from '../ui';
import { BudgetProgress } from '../dashboard';
import { formatCurrency } from '../../constants';
import { BudgetPeriodsUtils, CategoryUtils } from '../../lib/utils';
import type { BudgetPeriodData } from '../../types';

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
  selectedYear: number;
}>(({ data, selectedYear }) => (
  <Card>
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Trend Finanziario Mensile
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Confronto entrate e spese per l'anno {selectedYear}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entrate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spese</span>
          </div>
        </div>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor', opacity: 0.3 }}
              tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor', opacity: 0.3 }}
              tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'entrata' ? 'Entrate' : 'Spese'
              ]}
              labelFormatter={(label) => `${label} ${selectedYear}`}
              contentStyle={{
                backgroundColor: 'rgb(255 255 255 / 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgb(229 231 235)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                color: '#374151'
              }}
              cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
            />
            <Bar 
              dataKey="entrata" 
              fill="#10B981" 
              name="entrata"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
            <Bar 
              dataKey="spesa" 
              fill="#EF4444" 
              name="spesa"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
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
  const { transactions, budgets, people, getAccountById } = useFinance();
  const { availableYears, selectedYear, setSelectedYear } = useYearSelection(transactions);
  const { yearlyTransactions, annualSummary, monthlyData, netBalance } = useAnnualReports(
    selectedPersonId, 
    selectedYear
  );

  // Stati per il selettore del BudgetProgress
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<BudgetPeriodData | undefined>(undefined);

  // Calcola i periodi di budget disponibili dal database della persona
  const availableBudgetPeriods = useMemo(() => {
    if (selectedPersonId === 'all') {
      // Per la vista "all", usa i periodi della prima persona con budgetStartDate
      const firstPersonWithBudget = people.find(person => person.budgetStartDate);
      if (!firstPersonWithBudget) {
        return [];
      }

      return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(firstPersonWithBudget);
    } else {
      // Per persona specifica, usa i suoi periodi dal database
      const selectedPerson = people.find(p => p.id === selectedPersonId);
      if (!selectedPerson || !selectedPerson.budgetStartDate) {
        return [];
      }

      return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(selectedPerson);
    }
  }, [selectedPersonId, people]);

  // Imposta il periodo corrente come default se non c'è selezione
  React.useEffect(() => {
    if (!selectedBudgetPeriod && availableBudgetPeriods.length > 0) {
      // Prendi il periodo più recente come default
      setSelectedBudgetPeriod(availableBudgetPeriods[0]);
    }
  }, [availableBudgetPeriods, selectedBudgetPeriod]);

  // Aggiorna il periodo quando cambia la selezione della persona
  React.useEffect(() => {
    if (availableBudgetPeriods.length > 0) {
      setSelectedBudgetPeriod(availableBudgetPeriods[0]);
    } else {
      setSelectedBudgetPeriod(undefined);
    }
  }, [selectedPersonId]);

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

  const handleBudgetPeriodChange = (period: BudgetPeriodData) => {
    setSelectedBudgetPeriod(period);
  };

  // Trova la persona di riferimento per i periodi di budget
  const budgetReferencePerson = useMemo(() => {
    if (selectedPersonId === 'all') {
      return people.find(person => person.budgetStartDate);
    } else {
      return people.find(p => p.id === selectedPersonId);
    }
  }, [selectedPersonId, people]);

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
        selectedYear={selectedYear}
      />

      {/* Storico Budget */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Storico Budget {selectedYear}
              {budgetReferencePerson && (
                <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                  (Periodi di {budgetReferencePerson.name})
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Panoramica completa dei budget con transazioni e categorie associate
            </p>
          </div>
          
          {budgets.length > 0 ? (
            <BudgetProgress 
              budgets={budgets}
              people={people}
              selectedPersonId={selectedPersonId !== 'all' ? selectedPersonId : undefined}
              isReportMode={true}
              availablePeriods={availableBudgetPeriods}
              selectedPeriod={selectedBudgetPeriod}
              onPeriodChange={handleBudgetPeriodChange}
            />
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Nessun budget configurato per l'anno selezionato.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

ReportsPage.displayName = 'ReportsPage';
