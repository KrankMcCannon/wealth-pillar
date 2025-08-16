import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../../../constants';
import { BudgetPeriodsUtils } from '../../../lib/utils';
import type { BudgetPeriodData } from '../../../types';
import { useAnnualReports, useFinance, usePersonFilter, useYearSelection } from '../../index';

/**
 * Hook encapsulating all state and derived values for the ReportsPage.
 * This hook centralises the logic for selecting years, budget periods and
 * computing summary data. The page component can use this hook to obtain
 * everything it needs to render the reports UI.
 */
export const useReportsPage = () => {
  // Person and finance data
  const { selectedPersonId, selectedPerson } = usePersonFilter();
  const { transactions, budgets, people } = useFinance();

  // Year selection
  const { availableYears, selectedYear, setSelectedYear } = useYearSelection(transactions);
  // Annual reports for the selected person and year
  const { yearlyTransactions, annualSummary, monthlyData, netBalance } = useAnnualReports(
    selectedPersonId,
    selectedYear,
  );

  // Budget period selection state
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<BudgetPeriodData | undefined>(undefined);

  // Compute available budget periods based on the selected person
  const availableBudgetPeriods = useMemo(() => {
    if (selectedPersonId === 'all') {
      // In "all" view, use the first person with a budgetStartDate
      const firstPersonWithBudget = people.find((person) => person.budgetStartDate);
      if (!firstPersonWithBudget) {
        return [] as BudgetPeriodData[];
      }
      return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(firstPersonWithBudget);
    } else {
      const selPerson = people.find((p) => p.id === selectedPersonId);
      if (!selPerson || !selPerson.budgetStartDate) {
        return [] as BudgetPeriodData[];
      }
      return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(selPerson);
    }
  }, [selectedPersonId, people]);

  // Default budget period selection when available periods change or no period selected
  useEffect(() => {
    if (!selectedBudgetPeriod && availableBudgetPeriods.length > 0) {
      setSelectedBudgetPeriod(availableBudgetPeriods[0]);
    }
  }, [availableBudgetPeriods, selectedBudgetPeriod]);

  // Reset budget period when person selection changes
  useEffect(() => {
    if (availableBudgetPeriods.length > 0) {
      setSelectedBudgetPeriod(availableBudgetPeriods[0]);
    } else {
      setSelectedBudgetPeriod(undefined);
    }
  }, [selectedPersonId]);

  // Build summary cards data
  const summaryCardsData = useMemo(
    () => [
      {
        title: 'Entrate Totali',
        value: formatCurrency(annualSummary.entrata),
        change: undefined,
        trend: 'up' as const,
        color: 'green',
      },
      {
        title: 'Spese Totali',
        value: formatCurrency(annualSummary.spesa),
        change: undefined,
        trend: 'down' as const,
        color: 'red',
      },
      {
        title: 'Bilancio Netto',
        value: formatCurrency(netBalance),
        change: undefined,
        trend: netBalance >= 0 ? ('up' as const) : ('down' as const),
        color: netBalance >= 0 ? 'green' : 'red',
      },
      {
        title: 'Transazioni',
        value: yearlyTransactions.length.toString(),
        change: undefined,
        trend: 'neutral' as const,
        color: 'blue',
      },
    ],
    [annualSummary, netBalance, yearlyTransactions],
  );

  /**
   * Handle year selection change.
   */
  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
    },
    [setSelectedYear],
  );

  /**
   * Handle budget period selection change.
   */
  const handleBudgetPeriodChange = useCallback(
    (period: BudgetPeriodData) => {
      setSelectedBudgetPeriod(period);
    },
    [],
  );

  // Determine the person referenced in the budget history header
  const budgetReferencePerson = useMemo(() => {
    if (selectedPersonId === 'all') {
      return people.find((person) => person.budgetStartDate);
    }
    return people.find((p) => p.id === selectedPersonId);
  }, [selectedPersonId, people]);

  return {
    selectedPersonId,
    selectedPerson,
    availableYears,
    selectedYear,
    yearlyTransactions,
    annualSummary,
    monthlyData,
    netBalance,
    summaryCardsData,
    handleYearChange,
    availableBudgetPeriods,
    selectedBudgetPeriod,
    setSelectedBudgetPeriod,
    handleBudgetPeriodChange,
    budgetReferencePerson,
    budgets,
    people,
  };
};