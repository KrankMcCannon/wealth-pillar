import { useCallback, useMemo, useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useClerkSupabaseClient } from "../../../lib/supabase/client";
import { ServiceFactory } from "../../../lib/supabase/services/service-factory";
import { Person } from "../../../types";
import { useFinance } from "../../core/useFinance";
import { useGroups } from "../groups/useGroups";

// Importiamo i tipi dal file centrale
import type { OnboardingGroup, OnboardingPerson, OnboardingAccount, OnboardingBudget } from "../../../types";
import { OnboardingService, OnboardingData } from "../../../lib/services/onboarding.service";
import { useOnboardingCompletion } from "./useOnboardingCompletion";
import { useOnboardingPersistence } from "./useOnboardingPersistence";

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
 * Principio DIP: Dependency Inversion - dipende da astrazioni (hooks compositi)
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

  // Hook compositi per funzionalità specifiche
  const completion = useOnboardingCompletion();
  const persistence = useOnboardingPersistence(user?.id);

  /**
   * Ripristina lo stato da una sessione precedente se disponibile
   */
  useEffect(() => {
    if (persistence.isHydrated && persistence.hasPersistedState()) {
      const savedState = persistence.loadOnboardingState();
      if (savedState) {
        setState((prev) => ({
          ...prev,
          currentStep: savedState.currentStep,
          group: savedState.group,
          people: savedState.people,
          accounts: savedState.accounts,
          budgets: savedState.budgets,
        }));
      }
    }
  }, [persistence]);

  /**
   * Salva lo stato automaticamente ad ogni cambiamento significativo
   */
  useEffect(() => {
    if (persistence.isHydrated && user?.id) {
      persistence.createStateSnapshot({
        currentStep: state.currentStep,
        group: state.group,
        people: state.people,
        accounts: state.accounts,
        budgets: state.budgets,
      });
    }
  }, [state.currentStep, state.group, state.people, state.accounts, state.budgets, persistence, user?.id]);

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
   * Completa l'onboarding usando il hook di completamento
   */
  const completeOnboarding = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Prepara i dati per il completamento
    const onboardingData: OnboardingData = {
      group: state.group!,
      people: state.people,
      accounts: state.accounts,
      budgets: state.budgets,
    };

    // Valida i dati prima del completamento
    const validation = OnboardingService.validateCompleteOnboarding(onboardingData);
    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Errori di validazione: ${Object.values(validation.errors).join(", ")}`,
      }));
      return;
    }

    try {
      const result = await completion.completeOnboarding(onboardingData);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          currentStep: OnboardingStep.COMPLETED,
          isLoading: false,
          error: null,
        }));

        // Rimuovi lo stato salvato una volta completato con successo
        persistence.clearOnboardingState();
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Errore durante il completamento",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      }));
    }
  }, [state, completion, persistence]);

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

    // Pulisce anche la persistenza e lo stato di completamento
    persistence.clearOnboardingState();
    completion.resetCompletion();
  }, [persistence, completion]);

  /**
   * Controlla se lo step corrente può essere completato usando il service
   */
  const canCompleteCurrentStep = useMemo(() => {
    switch (state.currentStep) {
      case OnboardingStep.GROUP:
        return OnboardingService.validateGroupStep(state.group).canProceed;
      case OnboardingStep.PEOPLE:
        return OnboardingService.validatePeopleStep(state.people).canProceed;
      case OnboardingStep.ACCOUNTS:
        return OnboardingService.validateAccountsStep(state.accounts, state.people).canProceed;
      case OnboardingStep.BUDGETS:
        return OnboardingService.validateBudgetsStep(state.budgets, state.people).canProceed;
      default:
        return false;
    }
  }, [state]);

  /**
   * Progresso dell'onboarding (percentuale) usando il service
   */
  const progress = useMemo(() => {
    return OnboardingService.calculateProgress(state.currentStep);
  }, [state.currentStep]);

  /**
   * Crea un riepilogo dei dati per la fase di completamento
   */
  const getCompletionData = useCallback((): OnboardingData | undefined => {
    if (!state.group) return undefined;

    return {
      group: state.group,
      people: state.people,
      accounts: state.accounts,
      budgets: state.budgets,
    };
  }, [state]);

  return {
    // Stato principale
    ...state,
    canCompleteCurrentStep,
    progress,

    // Stato dei hook compositi
    completion: {
      isLoading: completion.isLoading,
      isCompleted: completion.isCompleted,
      error: completion.error,
      progress: completion.progress,
      currentOperation: completion.currentOperation,
    },
    persistence: {
      isHydrated: persistence.isHydrated,
      hasPersistedState: persistence.hasPersistedState(),
    },

    // Azioni principali
    goToNextStep,
    goToPreviousStep,
    saveGroup,
    savePeople,
    saveAccounts,
    saveBudgets,
    completeOnboarding,
    resetOnboarding,

    // Utilità
    getCompletionData,
  };
};
