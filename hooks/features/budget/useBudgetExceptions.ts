import { useCallback, useMemo } from 'react';
import { BudgetExceptionUtils } from '../../../lib/utils/budget-exception.utils';
import { Person } from '../../../types';
import { useFinance } from '../../core/useFinance';

interface UseBudgetExceptionsProps {
  person: Person;
}

/**
 * Hook per gestire le eccezioni ai periodi di budget
 * Segue il principio Single Responsibility e DRY
 */
export const useBudgetExceptions = ({ person }: UseBudgetExceptionsProps) => {
  const { updatePerson } = useFinance();

  // Trova l'eccezione attiva corrente
  const activeException = useMemo(() => {
    return BudgetExceptionUtils.findActiveException(person);
  }, [person]);

  // Calcola il periodo corrente con eventuali eccezioni
  const currentPeriod = useMemo(() => {
    return BudgetExceptionUtils.getCurrentBudgetPeriodWithExceptions(person);
  }, [person]);

  // Determina se possiamo aggiungere una nuova eccezione
  const canAddException = useMemo(() => {
    // Non possiamo aggiungere un'eccezione se ne esiste già una attiva
    return !activeException;
  }, [activeException]);

  // Aggiunge una nuova eccezione budget
  const addBudgetException = useCallback(async (
    exceptionDate: string,
    reason?: string
  ) => {
    if (!canAddException) {
      throw new Error('Esiste già un\'eccezione attiva per questo periodo');
    }

    const newException = BudgetExceptionUtils.createBudgetException(exceptionDate, reason);
    
    const updatedExceptions = [
      ...(person.budgetExceptions || []),
      newException
    ];

    const updatedPerson: Person = {
      ...person,
      budgetExceptions: updatedExceptions
    };

    await updatePerson(updatedPerson);
    return newException;
  }, [person, updatePerson, canAddException]);

  // Rimuove un'eccezione budget
  const removeBudgetException = useCallback(async (exceptionId: string) => {
    if (!person.budgetExceptions?.length) {
      return;
    }

    const updatedExceptions = person.budgetExceptions.filter(
      exception => exception.id !== exceptionId
    );

    const updatedPerson: Person = {
      ...person,
      budgetExceptions: updatedExceptions
    };

    await updatePerson(updatedPerson);
  }, [person, updatePerson]);

  // Pulisce eccezioni obsolete
  const cleanupOldExceptions = useCallback(async () => {
    const cleanedPerson = BudgetExceptionUtils.cleanupOldExceptions(person);
    
    if (cleanedPerson.budgetExceptions?.length !== person.budgetExceptions?.length) {
      await updatePerson(cleanedPerson);
    }
  }, [person, updatePerson]);

  // Calcola un'anteprima del periodo se si aggiungesse un'eccezione
  const previewExceptionPeriod = useCallback((exceptionDate: string) => {
    const tempException = BudgetExceptionUtils.createBudgetException(exceptionDate);
    return BudgetExceptionUtils.calculateExceptionPeriods(person, tempException);
  }, [person]);

  // Lista di tutte le eccezioni della persona ordinate per data
  const allExceptions = useMemo(() => {
    if (!person.budgetExceptions?.length) {
      return [];
    }

    return person.budgetExceptions
      .slice()
      .sort((a, b) => new Date(b.exceptionDate).getTime() - new Date(a.exceptionDate).getTime());
  }, [person.budgetExceptions]);

  // Statistiche delle eccezioni
  const exceptionStats = useMemo(() => {
    return {
      total: allExceptions.length,
      active: activeException ? 1 : 0,
      thisMonth: allExceptions.filter(exception => {
        const exceptionDate = new Date(exception.exceptionDate);
        const thisMonth = new Date();
        return exceptionDate.getMonth() === thisMonth.getMonth() &&
               exceptionDate.getFullYear() === thisMonth.getFullYear();
      }).length
    };
  }, [allExceptions, activeException]);

  return {
    // Stato corrente
    activeException,
    currentPeriod,
    allExceptions,
    exceptionStats,
    
    // Flags
    canAddException,
    hasActiveException: !!activeException,
    
    // Azioni
    addBudgetException,
    removeBudgetException,
    cleanupOldExceptions,
    previewExceptionPeriod,
    
    // Utilities
    formatExceptionDate: BudgetExceptionUtils.formatExceptionDate,
    isWeekend: BudgetExceptionUtils.isWeekend
  };
};
