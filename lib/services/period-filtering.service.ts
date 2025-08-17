import { Budget, Person, Transaction, BudgetPeriodData } from "../../types";
import { BudgetPeriodsUtils } from "../utils";

export interface PeriodFilteringOptions {
  selectedPeriod?: BudgetPeriodData;
  selectedPersonId?: string;
  isReportMode?: boolean;
}

/**
 * Service per gestire il filtro dei periodi e delle persone
 * Principio SRP: Si occupa solo della logica di filtro periodi/persone
 */
export class PeriodFilteringService {
  /**
   * Determina quale persona dovrebbe essere proprietaria dei budget visualizzati
   * basandosi sul periodo selezionato
   */
  static getEffectivePerson(
    selectedPeriod: BudgetPeriodData | undefined,
    people: Person[],
    selectedPersonId?: string
  ): Person | null {
    if (!selectedPeriod) {
      return null;
    }

    // Trova la persona che ha questo periodo nei suoi budgetPeriods
    const periodOwner = people.find((person) => {
      const personPeriods = BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(person);
      return personPeriods.some(
        (period) =>
          period.startDate === selectedPeriod.startDate &&
          period.endDate === selectedPeriod.endDate &&
          period.isCompleted === selectedPeriod.isCompleted
      );
    });

    return periodOwner || null;
  }

  /**
   * Filtra i budget per mostrare solo quelli della persona proprietaria del periodo
   */
  static filterBudgetsForPeriod(
    budgets: Budget[],
    selectedPeriod: BudgetPeriodData | undefined,
    people: Person[],
    selectedPersonId?: string
  ): Budget[] {
    if (!selectedPeriod) {
      return budgets;
    }

    const effectivePerson = this.getEffectivePerson(selectedPeriod, people, selectedPersonId);

    if (!effectivePerson) {
      return budgets;
    }

    // Filtra solo i budget della persona proprietaria del periodo
    return budgets.filter((budget) => budget.personId === effectivePerson.id);
  }

  /**
   * Filtra le transazioni per il periodo specifico del budget
   * Gestisce sia periodi aperti che chiusi
   */
  static filterTransactionsForBudgetPeriod(
    transactions: Transaction[],
    selectedPeriod: BudgetPeriodData | undefined,
    budget: Budget,
    people: Person[]
  ): Transaction[] {
    if (!selectedPeriod) {
      return transactions;
    }

    const periodOwner = people.find((person) => person.id === budget.personId);
    if (!periodOwner) {
      return transactions;
    }

    // Usa le date del periodo selezionato
    const periodStart = new Date(selectedPeriod.startDate);
    let periodEnd: Date;

    if (selectedPeriod.endDate) {
      // Periodo chiuso: usa la data di fine reale
      periodEnd = new Date(selectedPeriod.endDate);
    } else {
      // Periodo aperto: calcola la data di fine teorica
      const endDateString = BudgetPeriodsUtils.calculatePeriodEndDate(periodOwner, selectedPeriod.startDate);
      periodEnd = new Date(endDateString);
    }

    // Filtra le transazioni per il periodo specifico
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= periodStart && transactionDate <= periodEnd;
    });
  }

  /**
   * Verifica se un budget dovrebbe essere mostrato nella vista corrente
   */
  static shouldShowBudget(budget: Budget, options: PeriodFilteringOptions, people: Person[]): boolean {
    const { selectedPeriod, selectedPersonId, isReportMode } = options;

    // In modalità normale (home), mostra tutti i budget della persona selezionata
    if (!isReportMode) {
      if (!selectedPersonId || selectedPersonId === "all") {
        return true;
      }
      return budget.personId === selectedPersonId;
    }

    // In modalità report, filtra per la persona proprietaria del periodo
    if (selectedPeriod) {
      const effectivePerson = this.getEffectivePerson(selectedPeriod, people, selectedPersonId);
      return effectivePerson ? budget.personId === effectivePerson.id : false;
    }

    return true;
  }

  /**
   * Ottiene informazioni sul periodo e la persona per la UI
   */
  static getPeriodDisplayInfo(
    selectedPeriod: BudgetPeriodData | undefined,
    people: Person[]
  ): { personName?: string; periodLabel?: string } {
    if (!selectedPeriod) {
      return {};
    }

    const effectivePerson = this.getEffectivePerson(selectedPeriod, people);

    const startDate = new Date(selectedPeriod.startDate);
    let periodLabel = startDate.toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });

    if (selectedPeriod.endDate) {
      const endDate = new Date(selectedPeriod.endDate);
      periodLabel += ` - ${endDate.toLocaleDateString("it-IT", {
        month: "long",
        year: "numeric",
      })}`;
    } else {
      periodLabel += " - In corso";
    }

    if (selectedPeriod.isCompleted) {
      periodLabel += " (Completato)";
    }

    return {
      personName: effectivePerson?.name,
      periodLabel,
    };
  }
}
