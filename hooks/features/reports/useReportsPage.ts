import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../../constants";
import { BudgetPeriodsUtils } from "../../../lib/utils";
import type { BudgetPeriodData } from "../../../types";
import { useAnnualReports, useFinance, usePersonFilter, useYearSelection } from "../../index";

enum SummaryCardsColor {
  GREEN = "green",
  RED = "red",
  BLUE = "blue",
  YELLOW = "yellow",
  GRAY = "gray",
}

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
    selectedYear
  );

  // Budget period selection state
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<BudgetPeriodData | undefined>(undefined);

  // Compute available budget periods based on the selected person
  const availableBudgetPeriods = useMemo(() => {
    if (selectedPersonId === "all") {
      // In "all" view, collect all periods from all people with budgets
      const allPeriods: BudgetPeriodData[] = [];
      const processedPeriods = new Set<string>(); // Per evitare duplicati

      people.forEach((person) => {
        if (person.budgetStartDate) {
          const personPeriods = BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(person);
          personPeriods.forEach((period) => {
            const periodKey = `${period.startDate}-${period.endDate || "ongoing"}`;
            if (!processedPeriods.has(periodKey)) {
              allPeriods.push(period);
              processedPeriods.add(periodKey);
            }
          });
        }
      });

      // Ordina per data di inizio
      return allPeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else {
      const selPerson = people.find((p) => p.id === selectedPersonId);
      if (!selPerson || !selPerson.budgetStartDate) {
        return [] as BudgetPeriodData[];
      }
      return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(selPerson);
    }
  }, [selectedPersonId, people]);

  // Simple period management - no competing useEffects
  useEffect(() => {
    if (availableBudgetPeriods.length === 0) {
      setSelectedBudgetPeriod(undefined);
      return;
    }

    // Only set first period if no period is selected
    if (!selectedBudgetPeriod) {
      setSelectedBudgetPeriod(availableBudgetPeriods[0]);
    }
  }, [availableBudgetPeriods]); // Remove selectedBudgetPeriod from deps to avoid loops

  // Build summary cards data
  const summaryCardsData = useMemo(
    () => [
      {
        title: "Entrate Totali",
        value: formatCurrency(annualSummary.entrata),
        change: undefined,
        trend: "up" as const,
        color: SummaryCardsColor.GREEN,
      },
      {
        title: "Spese Totali",
        value: formatCurrency(annualSummary.spesa),
        change: undefined,
        trend: "down" as const,
        color: SummaryCardsColor.RED,
      },
      {
        title: "Bilancio Netto",
        value: formatCurrency(netBalance),
        change: undefined,
        trend: netBalance >= 0 ? ("up" as const) : ("down" as const),
        color: netBalance >= 0 ? SummaryCardsColor.GREEN : SummaryCardsColor.RED,
      },
      {
        title: "Transazioni",
        value: yearlyTransactions.length.toString(),
        change: undefined,
        trend: "neutral" as const,
        color: SummaryCardsColor.BLUE,
      },
    ],
    [annualSummary, netBalance, yearlyTransactions]
  );

  /**
   * Handle year selection change.
   */
  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
    },
    [setSelectedYear]
  );

  /**
   * Handle budget period selection change.
   */
  const handleBudgetPeriodChange = useCallback((period: BudgetPeriodData) => {
    setSelectedBudgetPeriod(period);
  }, []);

  // Determine the person referenced in the budget history header
  const budgetReferencePerson = useMemo(() => {
    if (selectedPersonId === "all") {
      // In modalità 'all', mostra il numero di persone con budget
      const peopleWithBudgets = people.filter((person) => person.budgetStartDate);
      return peopleWithBudgets.length > 0 ? { name: `${peopleWithBudgets.length} persone` } : null;
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
