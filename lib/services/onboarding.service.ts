import {
  Person,
  Account,
  Budget,
  Group,
  OnboardingGroup,
  OnboardingPerson,
  OnboardingAccount,
  OnboardingBudget,
} from "../../types";
import { BudgetPeriodsUtils } from "../utils";
import { GroupsService } from "../supabase/services/groups.service";

export interface OnboardingData {
  group: OnboardingGroup;
  people: OnboardingPerson[];
  accounts: OnboardingAccount[];
  budgets: OnboardingBudget[];
}

export interface OnboardingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface OnboardingStepValidation {
  canProceed: boolean;
  requiredItems: string[];
  validationMessages: string[];
}

/**
 * Service per gestire il flusso di onboarding
 * Principio SRP: Si occupa solo della logica di business dell'onboarding
 * Principio DRY: Centralizza validazioni e operazioni comuni
 */
export class OnboardingService {
  /**
   * Validazione step 1: Gruppo
   */
  static validateGroupStep(group: OnboardingGroup | null): OnboardingStepValidation {
    if (!group) {
      return {
        canProceed: false,
        requiredItems: ["Gruppo"],
        validationMessages: ["È necessario creare un gruppo per continuare"],
      };
    }

    const errors: string[] = [];

    if (!group.name?.trim()) {
      errors.push("Il nome del gruppo è obbligatorio");
    } else if (group.name.trim().length < 2) {
      errors.push("Il nome del gruppo deve essere di almeno 2 caratteri");
    }

    return {
      canProceed: errors.length === 0,
      requiredItems: errors.length > 0 ? ["Nome gruppo valido"] : [],
      validationMessages: errors,
    };
  }

  /**
   * Validazione step 2: Persone (almeno una)
   */
  static validatePeopleStep(people: OnboardingPerson[]): OnboardingStepValidation {
    if (!people || people.length === 0) {
      return {
        canProceed: false,
        requiredItems: ["Almeno una persona"],
        validationMessages: ["È necessario aggiungere almeno una persona"],
      };
    }

    const errors: string[] = [];
    const names = new Set<string>();

    people.forEach((person, index) => {
      const trimmedName = person.name?.trim();

      if (!trimmedName) {
        errors.push(`Persona ${index + 1}: Il nome è obbligatorio`);
      } else if (trimmedName.length < 2) {
        errors.push(`Persona ${index + 1}: Il nome deve essere di almeno 2 caratteri`);
      } else if (names.has(trimmedName.toLowerCase())) {
        errors.push(`Persona ${index + 1}: Il nome "${trimmedName}" è già stato utilizzato`);
      } else {
        names.add(trimmedName.toLowerCase());
      }

      // Validazione budget start date
      const startDay = parseInt(person.budgetStartDate);
      if (isNaN(startDay) || startDay < 1 || startDay > 31) {
        errors.push(`Persona ${index + 1}: Giorno di inizio budget non valido`);
      }
    });

    return {
      canProceed: errors.length === 0,
      requiredItems: errors.length > 0 ? ["Nomi validi e unici"] : [],
      validationMessages: errors,
    };
  }

  /**
   * Validazione step 3: Account (almeno uno per persona)
   */
  static validateAccountsStep(accounts: OnboardingAccount[], people: OnboardingPerson[]): OnboardingStepValidation {
    if (!accounts || accounts.length === 0) {
      return {
        canProceed: false,
        requiredItems: ["Almeno un account per persona"],
        validationMessages: ["È necessario creare almeno un account per ogni persona"],
      };
    }

    const errors: string[] = [];
    const accountsByPerson = new Map<string, OnboardingAccount[]>();

    // Raggruppa account per persona
    accounts.forEach((account) => {
      if (!accountsByPerson.has(account.personId)) {
        accountsByPerson.set(account.personId, []);
      }
      accountsByPerson.get(account.personId)!.push(account);
    });

    // Verifica che ogni persona abbia almeno un account
    people.forEach((person, index) => {
      const personAccounts = accountsByPerson.get(person.name) || [];
      if (personAccounts.length === 0) {
        errors.push(`${person.name}: È necessario almeno un account`);
      }

      // Validazione singoli account
      personAccounts.forEach((account, accountIndex) => {
        if (!account.name?.trim()) {
          errors.push(`${person.name} - Account ${accountIndex + 1}: Il nome è obbligatorio`);
        }
        if (!account.type) {
          errors.push(`${person.name} - Account ${accountIndex + 1}: Il tipo è obbligatorio`);
        }
      });
    });

    return {
      canProceed: errors.length === 0,
      requiredItems: errors.length > 0 ? ["Account validi per ogni persona"] : [],
      validationMessages: errors,
    };
  }

  /**
   * Validazione step 4: Budget (almeno uno per persona con start date)
   */
  static validateBudgetsStep(budgets: OnboardingBudget[], people: OnboardingPerson[]): OnboardingStepValidation {
    if (!budgets || budgets.length === 0) {
      return {
        canProceed: false,
        requiredItems: ["Almeno un budget per persona"],
        validationMessages: ["È necessario creare almeno un budget per ogni persona"],
      };
    }

    const errors: string[] = [];
    const budgetsByPerson = new Map<string, OnboardingBudget[]>();

    // Raggruppa budget per persona
    budgets.forEach((budget) => {
      if (!budgetsByPerson.has(budget.personId)) {
        budgetsByPerson.set(budget.personId, []);
      }
      budgetsByPerson.get(budget.personId)!.push(budget);
    });

    // Verifica che ogni persona abbia almeno un budget
    people.forEach((person) => {
      const personBudgets = budgetsByPerson.get(person.name) || [];
      if (personBudgets.length === 0) {
        errors.push(`${person.name}: È necessario almeno un budget`);
      }

      // Validazione singoli budget
      personBudgets.forEach((budget, budgetIndex) => {
        if (!budget.description?.trim()) {
          errors.push(`${person.name} - Budget ${budgetIndex + 1}: La descrizione è obbligatoria`);
        }
        if (!budget.amount || budget.amount <= 0) {
          errors.push(`${person.name} - Budget ${budgetIndex + 1}: L'importo deve essere maggiore di zero`);
        }
        if (!budget.categories || budget.categories.length === 0) {
          errors.push(`${person.name} - Budget ${budgetIndex + 1}: È necessario selezionare almeno una categoria`);
        }
      });
    });

    return {
      canProceed: errors.length === 0,
      requiredItems: errors.length > 0 ? ["Budget validi per ogni persona"] : [],
      validationMessages: errors,
    };
  }

  /**
   * Trasforma i dati di onboarding per la creazione delle entità
   */
  static prepareDataForCreation(data: OnboardingData): {
    groupData: { name: string; description?: string };
    peopleData: Array<Omit<Person, "id" | "groupId" | "role" | "createdAt" | "updatedAt">>;
    accountsData: Array<{ name: string; type: Account["type"]; personIds: string[] }>;
    budgetsData: Array<{ description: string; amount: number; categories: string[]; personId: string }>;
  } {
    const groupData = {
      name: data.group.name.trim(),
      description: data.group.description?.trim() || undefined,
    };

    const peopleData = data.people.map((person) => ({
      name: person.name.trim(),
      avatar:
        person.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name.trim())}&background=0D8ABC&color=fff`,
      themeColor: person.themeColor,
      budgetStartDate: person.budgetStartDate,
      budgetPeriods: [] as any[], // Inizialmente vuoto, sarà popolato quando si creano i budget
    }));

    // Gli account e budget saranno processati dopo la creazione delle persone
    // per ottenere gli ID reali
    const accountsData = data.accounts.map((account) => ({
      name: account.name.trim(),
      type: account.type,
      personIds: [] as string[], // Sarà popolato con ID reali
    }));

    const budgetsData = data.budgets.map((budget) => ({
      description: budget.description.trim(),
      amount: budget.amount,
      categories: budget.categories,
      personId: budget.personId, // Sarà sostituito con ID reale
    }));

    return {
      groupData,
      peopleData,
      accountsData,
      budgetsData,
    };
  }

  /**
   * Calcola il progresso dell'onboarding (0-100%)
   */
  static calculateProgress(currentStep: string): number {
    const steps = ["group", "people", "accounts", "budgets", "completed"];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  }

  /**
   * Ottiene il titolo per lo step corrente
   */
  static getStepTitle(currentStep: string): string {
    const titles = {
      group: "Crea il tuo gruppo",
      people: "Aggiungi persone",
      accounts: "Configura account",
      budgets: "Imposta budget",
      completed: "Configurazione completata",
    };
    return titles[currentStep as keyof typeof titles] || "Configurazione";
  }

  /**
   * Ottiene la descrizione per lo step corrente
   */
  static getStepDescription(currentStep: string): string {
    const descriptions = {
      group: "Crea un gruppo per organizzare le finanze con la tua famiglia o coinquilini",
      people: "Aggiungi almeno una persona al gruppo per gestire le finanze",
      accounts: "Crea almeno un account per ogni persona (conto corrente, contanti, etc.)",
      budgets: "Imposta budget mensili per ogni persona con categorie e date di inizio",
      completed: "Configurazione completata con successo!",
    };
    return descriptions[currentStep as keyof typeof descriptions] || "";
  }

  /**
   * Valida tutti i dati prima del completamento finale
   */
  static validateCompleteOnboarding(data: OnboardingData): OnboardingValidationResult {
    const errors: Record<string, string> = {};

    // Validazione gruppo
    const groupValidation = this.validateGroupStep(data.group);
    if (!groupValidation.canProceed) {
      errors.group = groupValidation.validationMessages.join(", ");
    }

    // Validazione persone
    const peopleValidation = this.validatePeopleStep(data.people);
    if (!peopleValidation.canProceed) {
      errors.people = peopleValidation.validationMessages.join(", ");
    }

    // Validazione account
    const accountsValidation = this.validateAccountsStep(data.accounts, data.people);
    if (!accountsValidation.canProceed) {
      errors.accounts = accountsValidation.validationMessages.join(", ");
    }

    // Validazione budget
    const budgetsValidation = this.validateBudgetsStep(data.budgets, data.people);
    if (!budgetsValidation.canProceed) {
      errors.budgets = budgetsValidation.validationMessages.join(", ");
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
