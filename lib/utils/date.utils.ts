/**
 * Utility per gestione delle date e giorni festivi
 */
export class DateUtils {
  /**
   * Giorni festivi fissi italiani (formato MM-DD)
   */
  private static readonly FIXED_HOLIDAYS = [
    '01-01', // Capodanno
    '01-06', // Epifania
    '04-25', // Festa della Liberazione
    '05-01', // Festa del Lavoro
    '06-02', // Festa della Repubblica
    '08-15', // Ferragosto
    '11-01', // Ognissanti
    '12-08', // Immacolata Concezione
    '12-25', // Natale
    '12-26', // Santo Stefano
  ];

  /**
   * Verifica se una data è un sabato o domenica
   */
  static isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domenica, 6 = sabato
  }

  /**
   * Verifica se una data è un giorno festivo fisso
   */
  static isFixedHoliday(date: Date): boolean {
    const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0');
    return this.FIXED_HOLIDAYS.includes(monthDay);
  }

  /**
   * Calcola la Pasqua per un determinato anno (algoritmo di Meeus/Jones/Butcher)
   */
  static getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }

  /**
   * Verifica se una data è Pasqua o Lunedì dell'Angelo
   */
  static isEasterHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const easter = this.getEasterDate(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    const dateString = date.toDateString();
    return dateString === easter.toDateString() || dateString === easterMonday.toDateString();
  }

  /**
   * Verifica se una data è un giorno festivo (weekend + festivi fissi + Pasqua)
   */
  static isHoliday(date: Date): boolean {
    return this.isWeekend(date) || this.isFixedHoliday(date) || this.isEasterHoliday(date);
  }

  /**
   * Sposta una data al giorno lavorativo precedente se cade in un festivo/weekend
   */
  static moveToPreviousWorkingDay(date: Date): Date {
    const result = new Date(date);
    
    while (this.isHoliday(result)) {
      result.setDate(result.getDate() - 1);
    }
    
    return result;
  }

  /**
   * Sposta una data al giorno lavorativo successivo se cade in un festivo/weekend
   */
  static moveToNextWorkingDay(date: Date): Date {
    const result = new Date(date);
    
    while (this.isHoliday(result)) {
      result.setDate(result.getDate() + 1);
    }
    
    return result;
  }

  /**
   * Formatta una data in formato ISO (YYYY-MM-DD) senza problemi di timezone
   */
  static toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
