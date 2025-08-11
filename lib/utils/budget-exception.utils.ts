import { getPreviousWorkingDay } from '../../constants';
import { BudgetPeriodException, Person } from '../../types';

/**
 * Utility class per gestire le eccezioni ai periodi di budget
 * Segue principi SOLID: Single Responsibility, Open/Closed
 */
export class BudgetExceptionUtils {
  /**
   * Trova l'eccezione attiva per il periodo corrente
   * @param person Persona con potenziali eccezioni
   * @param currentDate Data di riferimento (default: oggi)
   * @returns Eccezione attiva o null
   */
  static findActiveException(
    person: Person, 
    currentDate: Date = new Date()
  ): BudgetPeriodException | null {
    if (!person.budgetExceptions?.length) {
      return null;
    }

    // Trova l'eccezione più recente che si applica al periodo corrente
    const sortedExceptions = person.budgetExceptions
      .map(exception => ({
        ...exception,
        exceptionDateObj: new Date(exception.exceptionDate)
      }))
      .sort((a, b) => b.exceptionDateObj.getTime() - a.exceptionDateObj.getTime());

    for (const exception of sortedExceptions) {
      const exceptionDate = exception.exceptionDateObj;
      
      // Calcola i periodi con e senza l'eccezione per determinare se è attiva
      const { isInExceptionPeriod } = this.calculateExceptionPeriods(
        person, 
        exception, 
        currentDate
      );
      
      if (isInExceptionPeriod) {
        return exception;
      }
    }

    return null;
  }

  /**
   * Calcola i periodi di budget considerando un'eccezione
   * @param person Persona
   * @param exception Eccezione da applicare
   * @param referenceDate Data di riferimento
   * @returns Dati sui periodi calcolati
   */
  static calculateExceptionPeriods(
    person: Person,
    exception: BudgetPeriodException,
    referenceDate: Date = new Date()
  ) {
    const exceptionDate = new Date(exception.exceptionDate);
    const normalBudgetStartDay = parseInt(person.budgetStartDate);

    // Calcola il periodo normale senza eccezione
    const normalPeriod = this.calculateNormalPeriod(person, referenceDate);
    
    // Calcola quando sarebbe iniziato normalmente il periodo che include l'eccezione
    const normalPeriodForException = this.calculateNormalPeriod(person, exceptionDate);
    
    // Il periodo con eccezione:
    // - Inizia dalla data dell'eccezione
    // - Termina quando sarebbe iniziato il periodo successivo normale
    const exceptionPeriodStart = exceptionDate;
    
    // Calcola quando inizierebbe il prossimo periodo normale dopo l'eccezione
    const nextNormalPeriodStart = new Date(normalPeriodForException.periodEnd);
    nextNormalPeriodStart.setDate(nextNormalPeriodStart.getDate() + 1);
    
    // Il periodo dell'eccezione termina il giorno prima del prossimo periodo normale
    const exceptionPeriodEnd = new Date(nextNormalPeriodStart);
    exceptionPeriodEnd.setDate(exceptionPeriodEnd.getDate() - 1);
    exceptionPeriodEnd.setMonth(exceptionPeriodEnd.getMonth() + 1); // Un mese dopo
    
    // Aggiusta per i giorni lavorativi
    const adjustedExceptionEnd = getPreviousWorkingDay(
      new Date(exceptionPeriodEnd.getFullYear(), exceptionPeriodEnd.getMonth(), normalBudgetStartDay - 1)
    );

    // Determina se la data di riferimento è nel periodo dell'eccezione
    const isInExceptionPeriod = referenceDate >= exceptionPeriodStart && 
                               referenceDate <= adjustedExceptionEnd;

    return {
      normalPeriod,
      exceptionPeriod: {
        periodStart: exceptionPeriodStart,
        periodEnd: adjustedExceptionEnd
      },
      isInExceptionPeriod
    };
  }

  /**
   * Calcola il periodo budget normale senza eccezioni
   */
  private static calculateNormalPeriod(person: Person, referenceDate: Date) {
    const budgetStartDay = parseInt(person.budgetStartDate);
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const currentDay = referenceDate.getDate();

    let periodStart: Date;
    let periodEnd: Date;

    if (currentDay >= budgetStartDay) {
      // Siamo nel periodo budget corrente
      periodStart = new Date(year, month, budgetStartDay);
      periodStart = getPreviousWorkingDay(periodStart);

      // Calcola la data di fine (giorno prima dell'inizio del prossimo periodo)
      const nextPeriodStart = new Date(year, month + 1, budgetStartDay);
      const nextPeriodStartAdjusted = getPreviousWorkingDay(nextPeriodStart);
      periodEnd = new Date(nextPeriodStartAdjusted);
      periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
      // Siamo ancora nel periodo budget precedente
      periodStart = new Date(year, month - 1, budgetStartDay);
      periodStart = getPreviousWorkingDay(periodStart);

      // La data di fine è il giorno prima dell'inizio del periodo corrente
      const currentPeriodStart = new Date(year, month, budgetStartDay);
      const currentPeriodStartAdjusted = getPreviousWorkingDay(currentPeriodStart);
      periodEnd = new Date(currentPeriodStartAdjusted);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }

    return { periodStart, periodEnd };
  }

  /**
   * Calcola il periodo budget effettivo considerando le eccezioni
   * @param person Persona con potenziali eccezioni
   * @param referenceDate Data di riferimento (default: oggi)
   * @returns Periodo budget effettivo
   */
  static getCurrentBudgetPeriodWithExceptions(
    person: Person,
    referenceDate: Date = new Date()
  ): { periodStart: Date; periodEnd: Date; hasException: boolean; exception?: BudgetPeriodException } {
    const activeException = this.findActiveException(person, referenceDate);

    if (activeException) {
      const { exceptionPeriod } = this.calculateExceptionPeriods(person, activeException, referenceDate);
      return {
        periodStart: exceptionPeriod.periodStart,
        periodEnd: exceptionPeriod.periodEnd,
        hasException: true,
        exception: activeException
      };
    }

    // Nessuna eccezione attiva, usa il periodo normale
    const normalPeriod = this.calculateNormalPeriod(person, referenceDate);
    return {
      ...normalPeriod,
      hasException: false
    };
  }

  /**
   * Crea una nuova eccezione budget
   * @param exceptionDate Data dell'eccezione
   * @param reason Motivo dell'eccezione (opzionale)
   * @returns Nuova eccezione budget
   */
  static createBudgetException(
    exceptionDate: string,
    reason?: string
  ): BudgetPeriodException {
    return {
      id: `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exceptionDate,
      reason,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Rimuove eccezioni obsolete (più vecchie di 3 mesi)
   * @param person Persona con eccezioni
   * @returns Persona con eccezioni pulite
   */
  static cleanupOldExceptions(person: Person): Person {
    if (!person.budgetExceptions?.length) {
      return person;
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const activeExceptions = person.budgetExceptions.filter(exception => {
      const exceptionDate = new Date(exception.exceptionDate);
      return exceptionDate >= threeMonthsAgo;
    });

    return {
      ...person,
      budgetExceptions: activeExceptions
    };
  }

  /**
   * Verifica se una data è in un weekend
   * @param date Data da verificare
   * @returns true se è weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Domenica o Sabato
  }

  /**
   * Formatta una data per la visualizzazione
   * @param date Data da formattare
   * @returns Stringa formattata
   */
  static formatExceptionDate(date: Date): string {
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
