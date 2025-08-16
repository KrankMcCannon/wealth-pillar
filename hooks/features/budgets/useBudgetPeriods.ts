import { useCallback, useMemo, useState } from 'react';
import { BudgetPeriodsUtils } from '../../../lib/utils/budget-periods.utils';
import { Person } from '../../../types';
import { useFinance } from '../../core/useFinance';

interface UseBudgetPeriodsProps {
  person: Person;
}

/**
 * Hook per gestire i periodi di budget
 * Sostituisce il sistema di eccezioni con un approccio più semplice
 */
export const useBudgetPeriods = ({ person }: UseBudgetPeriodsProps) => {
  const { updatePerson } = useFinance();
  const [isLoading, setIsLoading] = useState(false);

  // Ottieni tutti i periodi di budget dal database
  const budgetPeriods = useMemo(() => {
    return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(person);
  }, [person]);

  // Trova il periodo corrente
  const currentPeriod = useMemo(() => {
    return BudgetPeriodsUtils.getCurrentPeriod(person);
  }, [person]);

  // Periodi completati
  const completedPeriods = useMemo(() => {
    return budgetPeriods.filter(period => period.isCompleted);
  }, [budgetPeriods]);

  // Periodi disponibili per selezione
  const availablePeriodsForSelection = useMemo(() => {
    return BudgetPeriodsUtils.getAvailablePeriodsForSelection(person);
  }, [person]);

  // Controlla se è possibile completare il periodo corrente
  const canCompletePeriod = useMemo(() => {
    return currentPeriod && !currentPeriod.isCompleted;
  }, [currentPeriod]);

  // Marca il periodo corrente come completato
  const completePeriod = useCallback(async (endDate: string) => {
    setIsLoading(true);
    try {
      const updatedPeriods = BudgetPeriodsUtils.markPeriodAsCompleted(person, endDate);
      
      const updatedPerson: Person = {
        ...person,
        budgetPeriods: updatedPeriods
      };

      await updatePerson(updatedPerson);
    } catch (error) {
      console.error('Error in completePeriod:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [person, currentPeriod, updatePerson]);

  // Crea un nuovo periodo
  const createNewPeriod = useCallback(async (startDates: string[]) => {
    setIsLoading(true);
    try {
      const updatedPeriods = BudgetPeriodsUtils.createNewPeriod(person, startDates);

      const updatedPerson: Person = {
        ...person,
        budgetPeriods: updatedPeriods
      };

      await updatePerson(updatedPerson);
    } finally {
      setIsLoading(false);
    }
  }, [person, updatePerson]);

  // Formatta data per display
  const formatPeriodDate = useCallback((startDate: string, endDate?: string) => {
    return BudgetPeriodsUtils.formatPeriodDate(startDate, endDate);
  }, []);

  // Rimuove un periodo dal database
  const removePeriod = useCallback(async (startDate: string) => {
    setIsLoading(true);
    try {
      const updatedPeriods = budgetPeriods.filter(p => p.startDate !== startDate);
      
      const updatedPerson: Person = {
        ...person,
        budgetPeriods: updatedPeriods
      };

      await updatePerson(updatedPerson);
    } finally {
      setIsLoading(false);
    }
  }, [person, budgetPeriods, updatePerson]);

  // Statistiche sui periodi
  const periodStats = useMemo(() => {
    return {
      total: budgetPeriods.length,
      completed: completedPeriods.length,
      current: currentPeriod && !currentPeriod.isCompleted ? 1 : 0,
      hasActivePeriod: !!currentPeriod
    };
  }, [budgetPeriods, completedPeriods, currentPeriod]);

  return {
    // Periodi
    budgetPeriods,
    currentPeriod,
    completedPeriods,
    availablePeriodsForSelection,
    
    // Azioni
    completePeriod,
    createNewPeriod,
    removePeriod,
    formatPeriodDate,
    
    // Stato
    canCompletePeriod,
    periodStats,
    isLoading
  };
};
