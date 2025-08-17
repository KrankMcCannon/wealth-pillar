import { useCallback, useEffect, useState } from "react";
import { OnboardingGroup, OnboardingPerson, OnboardingAccount, OnboardingBudget } from "../../../types";
import { OnboardingStep } from "./useOnboarding";

interface OnboardingPersistedState {
  currentStep: OnboardingStep;
  group: OnboardingGroup | null;
  people: OnboardingPerson[];
  accounts: OnboardingAccount[];
  budgets: OnboardingBudget[];
  lastUpdated: string;
  userId: string;
}

const STORAGE_KEY = "wealth-pillar-onboarding-state";
const STORAGE_VERSION = "1.0";

/**
 * Hook per gestire la persistenza dello stato di onboarding
 * Principio SRP: Si occupa solo della persistenza dei dati
 * Principio ISP: Interfaccia specifica per la gestione dello stato
 */
export const useOnboardingPersistence = (userId?: string) => {
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Salva lo stato dell'onboarding nel localStorage
   */
  const saveOnboardingState = useCallback(
    (state: Partial<OnboardingPersistedState>) => {
      if (!userId) return;

      try {
        const persistedState: OnboardingPersistedState = {
          currentStep: state.currentStep || OnboardingStep.GROUP,
          group: state.group || null,
          people: state.people || [],
          accounts: state.accounts || [],
          budgets: state.budgets || [],
          lastUpdated: new Date().toISOString(),
          userId,
        };

        const storageData = {
          version: STORAGE_VERSION,
          data: persistedState,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
      } catch (error) {
        console.warn("Errore nel salvare lo stato dell'onboarding:", error);
      }
    },
    [userId]
  );

  /**
   * Carica lo stato dell'onboarding dal localStorage
   */
  const loadOnboardingState = useCallback((): OnboardingPersistedState | null => {
    if (!userId) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const { version, data } = JSON.parse(stored);

      // Verifica versione per compatibilità
      if (version !== STORAGE_VERSION) {
        console.warn("Versione del localStorage non compatibile, stato rimosso");
        clearOnboardingState();
        return null;
      }

      // Verifica che il userId corrisponda
      if (data.userId !== userId) {
        return null;
      }

      // Verifica che i dati non siano troppo vecchi (7 giorni)
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        console.warn("Stato dell'onboarding troppo vecchio, rimosso");
        clearOnboardingState();
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Errore nel caricare lo stato dell'onboarding:", error);
      clearOnboardingState();
      return null;
    }
  }, [userId]);

  /**
   * Rimuove lo stato dell'onboarding dal localStorage
   */
  const clearOnboardingState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Errore nella rimozione dello stato dell'onboarding:", error);
    }
  }, []);

  /**
   * Controlla se esiste uno stato salvato per l'utente corrente
   */
  const hasPersistedState = useCallback((): boolean => {
    const state = loadOnboardingState();
    return state !== null;
  }, [loadOnboardingState]);

  /**
   * Salva singoli campi dello stato
   */
  const updatePersistedField = useCallback(
    <K extends keyof OnboardingPersistedState>(field: K, value: OnboardingPersistedState[K]) => {
      const currentState = loadOnboardingState();
      if (currentState) {
        saveOnboardingState({
          ...currentState,
          [field]: value,
        });
      }
    },
    [loadOnboardingState, saveOnboardingState]
  );

  /**
   * Crea uno snapshot dello stato corrente
   */
  const createStateSnapshot = useCallback(
    (state: {
      currentStep: OnboardingStep;
      group: OnboardingGroup | null;
      people: OnboardingPerson[];
      accounts: OnboardingAccount[];
      budgets: OnboardingBudget[];
    }) => {
      saveOnboardingState(state);
    },
    [saveOnboardingState]
  );

  /**
   * Ripristina lo stato dal snapshot
   */
  const restoreFromSnapshot = useCallback(() => {
    return loadOnboardingState();
  }, [loadOnboardingState]);

  /**
   * Validazione dei dati persistiti
   */
  const validatePersistedData = useCallback((data: OnboardingPersistedState): boolean => {
    try {
      // Validazione base
      if (!data.currentStep || !Object.values(OnboardingStep).includes(data.currentStep)) {
        return false;
      }

      // Validazione coerenza dati
      if (data.currentStep !== OnboardingStep.GROUP && !data.group) {
        return false;
      }

      if (data.currentStep === OnboardingStep.ACCOUNTS || data.currentStep === OnboardingStep.BUDGETS) {
        if (!data.people || data.people.length === 0) {
          return false;
        }
      }

      if (data.currentStep === OnboardingStep.BUDGETS) {
        if (!data.accounts || data.accounts.length === 0) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn("Errore nella validazione dei dati persistiti:", error);
      return false;
    }
  }, []);

  /**
   * Carica e valida lo stato salvato
   */
  const loadValidatedState = useCallback(() => {
    const state = loadOnboardingState();
    if (!state) return null;

    if (!validatePersistedData(state)) {
      console.warn("Dati persistiti non validi, stato rimosso");
      clearOnboardingState();
      return null;
    }

    return state;
  }, [loadOnboardingState, validatePersistedData, clearOnboardingState]);

  /**
   * Hook per l'idratazione iniziale
   */
  useEffect(() => {
    if (userId) {
      setIsHydrated(true);
    }
  }, [userId]);

  return {
    // Stato
    isHydrated,

    // Operazioni principali
    saveOnboardingState,
    loadOnboardingState: loadValidatedState,
    clearOnboardingState,
    hasPersistedState,

    // Operazioni specifiche
    updatePersistedField,
    createStateSnapshot,
    restoreFromSnapshot,

    // Utilità
    validatePersistedData,
  };
};
