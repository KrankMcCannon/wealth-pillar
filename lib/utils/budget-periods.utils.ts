import { BudgetPeriodData, Person } from '../../types';
import { DateUtils } from './date.utils';

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
   * e crea automaticamente il periodo successivo
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

    let updatedPeriods = [...periods];

    // Se il periodo corrente non esiste nella lista (è stato creato al volo)
    const existingPeriodIndex = periods.findIndex(p => p.startDate === currentPeriod.startDate);
    
    if (existingPeriodIndex === -1) {
      // Aggiungi il nuovo periodo completato con start e end date in un unico oggetto
      updatedPeriods.push({
        startDate: currentPeriod.startDate,
        endDate,
        isCompleted: true
      });
    } else {
      // Aggiorna il periodo esistente aggiungendo la data di fine
      updatedPeriods[existingPeriodIndex] = {
        ...currentPeriod,
        endDate,
        isCompleted: true
      };
    }

    // Crea automaticamente il periodo successivo
    const nextPeriodStartDate = this.calculateNextPeriodStartDate(person, endDate);
    if (nextPeriodStartDate) {
      updatedPeriods.push({
        startDate: nextPeriodStartDate,
        isCompleted: false
      });
    }

    return updatedPeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  /**
   * Calcola la data di fine di un periodo in corso basata su budgetStartDate
   * con gestione automatica dei giorni festivi
   */
  static calculatePeriodEndDate(person: Person, periodStartDate: string): string {
    if (!person.budgetStartDate) {
      // Fallback: 30 giorni dopo l'inizio del periodo
      const start = new Date(periodStartDate);
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      return DateUtils.toISODate(end);
    }

    const startDay = parseInt(person.budgetStartDate);
    const periodStart = new Date(periodStartDate);
    
    // Calcola il budgetStartDate del mese successivo al periodo corrente
    const nextPeriodStartRaw = new Date(
      periodStart.getFullYear(), 
      periodStart.getMonth() + 1, 
      startDay
    );
    
    // La data di fine è il giorno PRIMA del budgetStartDate del mese successivo
    const endDateRaw = new Date(nextPeriodStartRaw.getTime() - 24 * 60 * 60 * 1000);
    
    // Aggiusta questa data al giorno lavorativo precedente se cade su festivo/weekend
    const endDate = DateUtils.moveToPreviousWorkingDay(endDateRaw);

    return DateUtils.toISODate(endDate);
  }

  /**
   * Calcola la data di inizio del periodo successivo basata su budgetStartDate
   */
  static calculateNextPeriodStartDate(person: Person, currentEndDate: string): string | null {
    if (!person.budgetStartDate) {
      return null;
    }

    const endDate = new Date(currentEndDate);
    const startDay = parseInt(person.budgetStartDate);
    
    // Il periodo successivo inizia il giorno dopo la fine del periodo corrente,
    // ma seguendo il pattern del budgetStartDate del mese successivo, aggiustato al giorno lavorativo precedente
    const nextPeriodRaw = new Date(endDate.getFullYear(), endDate.getMonth() + 1, startDay);
    const nextPeriodAdjusted = DateUtils.moveToPreviousWorkingDay(nextPeriodRaw);
    
    return DateUtils.toISODate(nextPeriodAdjusted);
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

  /**
   * Calcola la data di inizio del primo periodo basata su budgetStartDate
   */
  static calculateFirstPeriodStartDate(budgetStartDay: number): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let periodStartDate: Date;
    
    if (today.getDate() <= budgetStartDay) {
      // Il giorno di inizio budget di questo mese non è ancora passato
      periodStartDate = new Date(currentYear, currentMonth, budgetStartDay);
    } else {
      // Il giorno di inizio budget di questo mese è già passato, inizia dal mese prossimo
      periodStartDate = new Date(currentYear, currentMonth + 1, budgetStartDay);
    }
    
    // Aggiusta al giorno lavorativo precedente
    const adjustedStartDate = DateUtils.moveToPreviousWorkingDay(periodStartDate);
    
    return DateUtils.toISODate(adjustedStartDate);
  }
}
