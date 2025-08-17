import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useClerkSupabaseClient } from "../../../lib/supabase/client";
import { ServiceFactory } from "../../../lib/supabase/services/service-factory";
import { Person } from "../../../types";
import { useFinance } from "../../core/useFinance";
import { useGroups } from "../groups/useGroups";

export interface OnboardingGroup {
  name: string;
  description?: string;
}

export interface OnboardingPerson {
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string;
}

export interface OnboardingAccount {
  name: string;
  type: "stipendio" | "risparmio" | "contanti" | "investimenti";
  personId: string;
}

export interface OnboardingBudget {
  description: string;
  amount: number;
  categories: string[];
  personId: string;
}

export enum OnboardingStep {
  GROUP = "group",
  PEOPLE = "people",
  ACCOUNTS = "accounts",
  BUDGETS = "budgets",
  COMPLETED = "completed",
}

interface OnboardingState {
  currentStep: OnboardingStep;
  group: OnboardingGroup | null;
  people: OnboardingPerson[];
  accounts: OnboardingAccount[];
  budgets: OnboardingBudget[];
  createdPeople: Person[]; // Persone create con ID reali
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook per gestire il flow di onboarding completo
 * Principio SRP: Single Responsibility - gestisce solo il flow di onboarding
 * Principio OCP: Open/Closed - facilmente estendibile per nuovi step
 */
export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: OnboardingStep.GROUP,
    group: null,
    people: [],
    accounts: [],
    budgets: [],
    createdPeople: [],
    isLoading: false,
    error: null,
  });

  const { createGroup, groups } = useGroups();
  const { addAccount, addBudget, addPerson, updatePerson, refreshData } = useFinance();
  const client = useClerkSupabaseClient();
  const { user } = useAuth();

  /**
   * Gestisce il passaggio al step successivo
   */
  const goToNextStep = useCallback(() => {
    setState((prev) => {
      const steps = Object.values(OnboardingStep);
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);

      return {
        ...prev,
        currentStep: steps[nextIndex],
        error: null,
      };
    });
  }, []);

  /**
   * Gestisce il passaggio al step precedente
   */
  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const steps = Object.values(OnboardingStep);
      const currentIndex = steps.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);

      return {
        ...prev,
        currentStep: steps[prevIndex],
        error: null,
      };
    });
  }, []);

  /**
   * Salva i dati del gruppo
   * Prima controlla se l'utente ha già un gruppo, altrimenti ne crea uno nuovo
   */
  const saveGroup = useCallback(
    async (groupData: OnboardingGroup) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Prima controlla se l'utente ha già gruppi caricati
        if (groups.length > 0) {
          // Usa il gruppo esistente
          console.log("Using existing group:", groups[0]);
          setState((prev) => ({
            ...prev,
            group: {
              name: groups[0].name,
              description: groups[0].description || undefined,
            },
            isLoading: false,
          }));
          goToNextStep();
          return;
        }

        // Se non ha gruppi, crea un nuovo gruppo
        const createdGroup = await createGroup(groupData);
        if (createdGroup) {
          setState((prev) => ({
            ...prev,
            group: groupData,
            isLoading: false,
          }));
          goToNextStep();
        } else {
          throw new Error("Errore nella creazione del gruppo");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Errore nella creazione del gruppo",
        }));
      }
    },
    [createGroup, goToNextStep, groups]
  );

  /**
   * Salva i dati delle persone creando le persone reali nel database
   */
  const savePeople = useCallback(
    async (peopleData: OnboardingPerson[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!client || !user?.id) {
          throw new Error("Client o utente non disponibile");
        }

        // Ottieni il groupId dell'utente corrente
        const financeService = ServiceFactory.createFinanceService(client, user.id);
        const groupId = await financeService.getUserGroupId();

        if (!groupId) {
          throw new Error("Nessun gruppo attivo trovato");
        }

        // Crea le persone nel database
        const createdPeople: Person[] = [];
        for (const personData of peopleData) {
          const newPerson = await addPerson({
            name: personData.name,
            avatar: personData.avatar,
            themeColor: personData.themeColor,
            budgetStartDate: personData.budgetStartDate,
            groupId,
            role: "member", // Ruolo di default
            budgetPeriods: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          createdPeople.push(newPerson);
        }

        setState((prev) => ({
          ...prev,
          people: peopleData,
          createdPeople,
          isLoading: false,
          error: null,
        }));
        goToNextStep();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Errore nella creazione delle persone",
        }));
      }
    },
    [addPerson, client, user, goToNextStep]
  );

  /**
   * Salva i dati degli account associandoli alle persone create
   */
  const saveAccounts = useCallback(
    (accountsData: OnboardingAccount[]) => {
      // Mappa gli account alle persone reali usando il nome come chiave
      const mappedAccounts = accountsData.map((account) => {
        const realPerson = state.createdPeople.find((p) => p.name === account.personId);
        if (!realPerson) {
          throw new Error(`Persona non trovata: ${account.personId}`);
        }
        return {
          ...account,
          personId: realPerson.id, // Usa l'ID reale della persona
        };
      });

      setState((prev) => ({
        ...prev,
        accounts: mappedAccounts,
        error: null,
      }));
      goToNextStep();
    },
    [state.createdPeople, goToNextStep]
  );

  /**
   * Salva i dati dei budget associandoli alle persone create
   */
  const saveBudgets = useCallback(
    (budgetsData: OnboardingBudget[]) => {
      // Mappa i budget alle persone reali usando il nome come chiave
      const mappedBudgets = budgetsData.map((budget) => {
        const realPerson = state.createdPeople.find((p) => p.name === budget.personId);
        if (!realPerson) {
          throw new Error(`Persona non trovata: ${budget.personId}`);
        }
        return {
          ...budget,
          personId: realPerson.id, // Usa l'ID reale della persona
        };
      });

      setState((prev) => ({
        ...prev,
        budgets: mappedBudgets,
        error: null,
      }));
      goToNextStep();
    },
    [state.createdPeople, goToNextStep]
  );

  /**
   * Completa l'onboarding salvando tutti i dati
   */
  const completeOnboarding = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!client || !user?.id) {
        throw new Error("Client o utente non disponibile");
      }

      // Ottieni il groupId dell'utente corrente
      const financeService = ServiceFactory.createFinanceService(client, user.id);
      const groupId = await financeService.getUserGroupId();

      if (!groupId) {
        throw new Error("Nessun gruppo attivo trovato");
      }

      // Crea tutti gli account
      for (const accountData of state.accounts) {
        await addAccount({
          name: accountData.name,
          type: accountData.type,
          personIds: [accountData.personId],
          balance: 0,
          groupId,
        });
      }

      // Crea tutti i budget
      for (const budgetData of state.budgets) {
        await addBudget({
          description: budgetData.description,
          amount: budgetData.amount,
          categories: budgetData.categories,
          personId: budgetData.personId,
          period: "monthly",
        });
      }

      // Aggiorna i dati dell'applicazione
      await refreshData();

      setState((prev) => ({
        ...prev,
        currentStep: OnboardingStep.COMPLETED,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Errore nel completamento dell'onboarding",
      }));
    }
  }, [state.accounts, state.budgets, addAccount, addBudget, refreshData, client, user]);

  /**
   * Reset dell'onboarding
   */
  const resetOnboarding = useCallback(() => {
    setState({
      currentStep: OnboardingStep.GROUP,
      group: null,
      people: [],
      accounts: [],
      budgets: [],
      createdPeople: [],
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Controlla se lo step corrente può essere completato
   */
  const canCompleteCurrentStep = useMemo(() => {
    switch (state.currentStep) {
      case OnboardingStep.GROUP:
        return state.group !== null;
      case OnboardingStep.PEOPLE:
        return state.people.length > 0;
      case OnboardingStep.ACCOUNTS:
        return state.accounts.length > 0;
      case OnboardingStep.BUDGETS:
        return state.budgets.length > 0 && state.budgets.length === state.people.length;
      default:
        return false;
    }
  }, [state]);

  /**
   * Progresso dell'onboarding (percentuale)
   */
  const progress = useMemo(() => {
    const steps = [
      OnboardingStep.GROUP,
      OnboardingStep.PEOPLE,
      OnboardingStep.ACCOUNTS,
      OnboardingStep.BUDGETS,
      OnboardingStep.COMPLETED,
    ];
    const currentIndex = steps.indexOf(state.currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  }, [state.currentStep]);

  return {
    // Stato
    ...state,
    canCompleteCurrentStep,
    progress,

    // Azioni
    goToNextStep,
    goToPreviousStep,
    saveGroup,
    savePeople,
    saveAccounts,
    saveBudgets,
    completeOnboarding,
    resetOnboarding,
  };
};
