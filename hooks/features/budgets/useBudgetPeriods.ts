import { useCallback, useState } from "react";
import { Person } from "../../../types";
import { BudgetService } from "../../../lib/services/budget.service";
import { useFinance } from "../../core/useFinance";

interface UseBudgetPeriodsProps {
  person: Person;
}

/**
 * Hook semplificato per gestire i periodi di budget
 * Utilizza il BudgetService per centralizzare la logica
 */
export const useBudgetPeriods = ({ person }: UseBudgetPeriodsProps) => {
  const { updatePerson } = useFinance();
  const [isLoading, setIsLoading] = useState(false);

  // Ottieni i dati dal service
  const budgetPeriods = BudgetService.getBudgetPeriods(person);
  const currentPeriod = BudgetService.getCurrentPeriod(person);
  const completedPeriods = budgetPeriods.filter((period) => period.isCompleted);
  const canCompletePeriod = BudgetService.canCompletePeriod(person);
  const periodStats = BudgetService.calculatePeriodStats(person);

  // Marca il periodo corrente come completato
  const completePeriod = useCallback(
    async (endDate: string) => {
      setIsLoading(true);
      try {
        const updatedPeriods = BudgetService.markPeriodAsCompleted(person, endDate);

        const updatedPerson: Person = {
          ...person,
          budgetPeriods: updatedPeriods,
        };

        await updatePerson(updatedPerson);
      } catch (error) {
        console.error("Error in completePeriod:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [person, updatePerson]
  );

  // Crea un nuovo periodo
  const createNewPeriod = useCallback(
    async (startDates: string[]) => {
      setIsLoading(true);
      try {
        const updatedPeriods = BudgetService.createNewPeriod(person, startDates);

        const updatedPerson: Person = {
          ...person,
          budgetPeriods: updatedPeriods,
        };

        await updatePerson(updatedPerson);
      } finally {
        setIsLoading(false);
      }
    },
    [person, updatePerson]
  );

  // Rimuove un periodo
  const removePeriod = useCallback(
    async (startDate: string) => {
      setIsLoading(true);
      try {
        const updatedPeriods = BudgetService.removePeriod(person, startDate);

        const updatedPerson: Person = {
          ...person,
          budgetPeriods: updatedPeriods,
        };

        await updatePerson(updatedPerson);
      } finally {
        setIsLoading(false);
      }
    },
    [person, updatePerson]
  );

  // Formatta data per display
  const formatPeriodDate = useCallback((startDate: string, endDate?: string) => {
    return BudgetService.formatPeriodDate(startDate, endDate);
  }, []);

  return {
    // Dati
    budgetPeriods,
    currentPeriod,
    completedPeriods,
    canCompletePeriod,
    periodStats,

    // Azioni
    completePeriod,
    createNewPeriod,
    removePeriod,
    formatPeriodDate,

    // Stato
    isLoading,
  };
};
