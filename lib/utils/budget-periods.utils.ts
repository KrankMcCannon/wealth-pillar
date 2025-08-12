import { BudgetPeriodData, Person } from '../../types';

/**
 * Utility per gestire i periodi di budget di una persona
 * Nuovo approccio semplificato con periodi che hanno data inizio e fine
 */
export class BudgetPeriodsUtils {
  /**
   * Ottiene tutti i periodi di budget dal database
   */
  static getBudgetPeriodsFromDatabase(person: Person): BudgetPeriodData[] {
    return person.budgetPeriods || [];
  }

  /**
   * Trova il periodo corrente (non completato)
   */
  static getCurrentPeriod(person: Person): BudgetPeriodData | null {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    
    // Trova il primo periodo non completato
    const incompletePeriod = periods
      .filter(period => !period.isCompleted)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    
    return incompletePeriod || null;
  }

  /**
   * Marca il periodo corrente come completato con la data di fine specificata
   */
  static markPeriodAsCompleted(
    person: Person, 
    endDate: string
  ): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    const currentPeriod = this.getCurrentPeriod(person);
    
    if (!currentPeriod) {
      return periods;
    }

    // Se il periodo corrente non esiste nella lista (è stato creato al volo)
    const existingPeriodIndex = periods.findIndex(p => p.startDate === currentPeriod.startDate);
    
    if (existingPeriodIndex === -1) {
      // Aggiungi il nuovo periodo completato con start e end date in un unico oggetto
      return [...periods, {
        startDate: currentPeriod.startDate,
        endDate,
        isCompleted: true
      }].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else {
      // Aggiorna il periodo esistente aggiungendo la data di fine
      const updatedPeriods = [...periods];
      updatedPeriods[existingPeriodIndex] = {
        ...currentPeriod,
        endDate,
        isCompleted: true
      };
      return updatedPeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
  }

  /**
   * Crea un nuovo periodo di budget
   */
  static createNewPeriod(
    person: Person, 
    startDate: string
  ): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    
    // Controlla se un periodo con questa data di inizio esiste già
    const periodExists = periods.some(p => p.startDate === startDate);
    if (periodExists) {
      return periods;
    }

    // Aggiunge il nuovo periodo
    const newPeriods = [...periods, {
      startDate,
      isCompleted: false
    }];

    return newPeriods.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  /**
   * Formatta la data di un periodo per la visualizzazione
   */
  static formatPeriodDate(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (endDate) {
      const end = new Date(endDate);
      const endFormatted = end.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return `${startFormatted} - ${endFormatted}`;
    }

    return `Dal ${startFormatted}`;
  }

  /**
   * Ottiene i periodi disponibili per la selezione
   */
  static getAvailablePeriodsForSelection(person: Person): BudgetPeriodData[] {
    const allPeriods = this.getBudgetPeriodsFromDatabase(person);
    const currentPeriod = this.getCurrentPeriod(person);
    
    // Includi il periodo corrente se non è già nella lista
    const currentExists = allPeriods.some(p => p.startDate === currentPeriod?.startDate);
    if (currentPeriod && !currentExists) {
      allPeriods.push(currentPeriod);
    }

    return allPeriods.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }
}
