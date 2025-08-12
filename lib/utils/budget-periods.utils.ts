import { getCurrentBudgetPeriod } from '../../constants';
import { BudgetPeriodData, Person } from '../../types';

/**
 * Utility per gestire i periodi di budget di una persona
 */
export class BudgetPeriodsUtils {
  /**
   * Ottiene tutti i periodi di budget di una persona dal database
   */
  static getBudgetPeriodsFromDatabase(person: Person): BudgetPeriodData[] {
    if (!person.budgetPeriods || person.budgetPeriods.length === 0) {
      // Se non ci sono periodi salvati, restituisce il periodo corrente
      const currentPeriod = getCurrentBudgetPeriod(person);
      return [{
        referenceDate: currentPeriod.periodStart.toISOString().split('T')[0],
        isCompleted: false
      }];
    }

    return person.budgetPeriods;
  }

  /**
   * Ottiene il periodo corrente (ultimo non completato o corrente per data)
   */
  static getCurrentPeriod(person: Person): BudgetPeriodData {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    
    // Trova l'ultimo periodo non completato
    const incompletePeriod = periods
      .filter(p => !p.isCompleted)
      .sort((a, b) => new Date(b.referenceDate).getTime() - new Date(a.referenceDate).getTime())[0];

    if (incompletePeriod) {
      return incompletePeriod;
    }

    // Se tutti i periodi sono completati, restituisce quello corrente per data
    const currentPeriod = getCurrentBudgetPeriod(person);
    return {
      referenceDate: currentPeriod.periodStart.toISOString().split('T')[0],
      isCompleted: false
    };
  }

  /**
   * Marca un periodo come completato
   */
  static markPeriodAsCompleted(
    person: Person, 
    referenceDate: string
  ): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    
    // Trova e aggiorna il periodo
    const updatedPeriods = periods.map(period => 
      period.referenceDate === referenceDate 
        ? { ...period, isCompleted: true }
        : period
    );

    // Se il periodo non esisteva, lo aggiunge come completato
    const periodExists = periods.some(p => p.referenceDate === referenceDate);
    if (!periodExists) {
      updatedPeriods.push({
        referenceDate,
        isCompleted: true
      });
    }

    return updatedPeriods.sort((a, b) => 
      new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime()
    );
  }

  /**
   * Crea un nuovo periodo di budget
   */
  static createNewPeriod(
    person: Person, 
    referenceDate: string
  ): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    
    // Controlla se il periodo esiste già
    const periodExists = periods.some(p => p.referenceDate === referenceDate);
    if (periodExists) {
      return periods;
    }

    // Aggiunge il nuovo periodo
    const newPeriods = [...periods, {
      referenceDate,
      isCompleted: false
    }];

    return newPeriods.sort((a, b) => 
      new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime()
    );
  }

  /**
   * Ottiene tutti i periodi disponibili per selezione (completati + corrente)
   */
  static getAvailablePeriodsForSelection(person: Person): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    const currentPeriod = this.getCurrentPeriod(person);

    // Combina periodi completati + periodo corrente
    const completedPeriods = periods.filter(p => p.isCompleted);
    const allPeriods = [...completedPeriods];

    // Aggiunge il periodo corrente se non è già presente
    const currentExists = allPeriods.some(p => p.referenceDate === currentPeriod.referenceDate);
    if (!currentExists) {
      allPeriods.push(currentPeriod);
    }

    return allPeriods.sort((a, b) => 
      new Date(b.referenceDate).getTime() - new Date(a.referenceDate).getTime()
    );
  }

  /**
   * Formatta la data di riferimento per display
   */
  static formatPeriodDate(referenceDate: string): string {
    const date = new Date(referenceDate);
    return date.toLocaleDateString('it-IT', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}
