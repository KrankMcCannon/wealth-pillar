import { useCallback, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useClerkSupabaseClient } from "../../../lib/supabase/client";
import { ServiceFactory } from "../../../lib/supabase/services/service-factory";
import { useFinance } from "../../core/useFinance";
import { useGroups } from "../groups/useGroups";
import { OnboardingData } from "../../../lib/services/onboarding.service";

interface OnboardingCompletionState {
  isLoading: boolean;
  isCompleted: boolean;
  error: string | null;
  progress: number;
  currentOperation: string;
}

interface OnboardingCompletionResult {
  success: boolean;
  error?: string;
  rollbackData?: {
    createdPersonIds: string[];
    createdAccountIds: string[];
    createdBudgetIds: string[];
  };
}

/**
 * Hook per gestire il completamento dell'onboarding con rollback automatico
 * Principio SRP: Gestisce solo il completamento dell'onboarding
 * Principio DIP: Dipende da astrazioni (services) non da implementazioni concrete
 */
export const useOnboardingCompletion = () => {
  const [state, setState] = useState<OnboardingCompletionState>({
    isLoading: false,
    isCompleted: false,
    error: null,
    progress: 0,
    currentOperation: "",
  });

  const { user } = useAuth();
  const client = useClerkSupabaseClient();
  const { addAccount, addBudget, addPerson, refreshData } = useFinance();
  const { deleteGroup } = useGroups();

  /**
   * Aggiorna lo stato del progresso
   */
  const updateProgress = useCallback((progress: number, operation: string) => {
    setState((prev) => ({
      ...prev,
      progress,
      currentOperation: operation,
    }));
  }, []);

  /**
   * Gestisce il rollback in caso di errore
   */
  const performRollback = useCallback(
    async (rollbackData: OnboardingCompletionResult["rollbackData"]) => {
      if (!rollbackData || !client || !user?.id) return;

      try {
        updateProgress(10, "Rollback in corso...");

        const financeService = ServiceFactory.createFinanceService(client, user.id);

        // Rimuove budget creati
        for (const budgetId of rollbackData.createdBudgetIds) {
          try {
            await financeService.budgets.delete(budgetId);
          } catch (error) {
            console.warn(`Errore durante la rimozione del budget ${budgetId}:`, error);
          }
        }

        updateProgress(40, "Rimozione account...");

        // Rimuove account creati
        for (const accountId of rollbackData.createdAccountIds) {
          try {
            await financeService.accounts.delete(accountId);
          } catch (error) {
            console.warn(`Errore durante la rimozione dell'account ${accountId}:`, error);
          }
        }

        updateProgress(70, "Rimozione persone...");

        // Rimuove persone create
        for (const personId of rollbackData.createdPersonIds) {
          try {
            await financeService.people.delete(personId);
          } catch (error) {
            console.warn(`Errore durante la rimozione della persona ${personId}:`, error);
          }
        }

        updateProgress(90, "Rimozione gruppo...");

        // Rimuove il gruppo (questo dovrebbe essere l'ultimo step)
        const groupId = await financeService.getUserGroupId();
        if (groupId) {
          try {
            await deleteGroup(groupId);
          } catch (error) {
            console.warn(`Errore durante la rimozione del gruppo ${groupId}:`, error);
          }
        }

        updateProgress(100, "Rollback completato");

        // Refresh dei dati per garantire coerenza
        await refreshData();
      } catch (error) {
        console.error("Errore durante il rollback:", error);
      }
    },
    [client, user, deleteGroup, refreshData, updateProgress]
  );

  /**
   * Completa l'onboarding con gestione degli errori e rollback
   */
  const completeOnboarding = useCallback(
    async (data: OnboardingData): Promise<OnboardingCompletionResult> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        progress: 0,
        currentOperation: "Inizializzazione...",
      }));

      const rollbackData: OnboardingCompletionResult["rollbackData"] = {
        createdPersonIds: [],
        createdAccountIds: [],
        createdBudgetIds: [],
      };

      try {
        if (!client || !user?.id) {
          throw new Error("Client o utente non disponibile");
        }

        updateProgress(10, "Verifica gruppo...");

        // Ottieni il groupId dell'utente corrente
        const financeService = ServiceFactory.createFinanceService(client, user.id);
        const groupId = await financeService.getUserGroupId();

        if (!groupId) {
          throw new Error("Nessun gruppo attivo trovato");
        }

        updateProgress(20, "Creazione persone...");

        // 1. Crea le persone
        const createdPeople = new Map<string, string>(); // nome -> id reale
        for (let i = 0; i < data.people.length; i++) {
          const personData = data.people[i];
          updateProgress(20 + (i / data.people.length) * 20, `Creazione persona: ${personData.name}`);

          const newPerson = await addPerson({
            name: personData.name,
            avatar: personData.avatar,
            themeColor: personData.themeColor,
            budgetStartDate: personData.budgetStartDate,
            groupId,
            role: "member",
            budgetPeriods: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          createdPeople.set(personData.name, newPerson.id);
          rollbackData.createdPersonIds.push(newPerson.id);
        }

        updateProgress(40, "Creazione account...");

        // 2. Crea gli account
        for (let i = 0; i < data.accounts.length; i++) {
          const accountData = data.accounts[i];
          const realPersonId = createdPeople.get(accountData.personId);

          if (!realPersonId) {
            throw new Error(`Persona non trovata per l'account: ${accountData.personId}`);
          }

          updateProgress(40 + (i / data.accounts.length) * 25, `Creazione account: ${accountData.name}`);

          await addAccount({
            name: accountData.name,
            type: accountData.type,
            personIds: [realPersonId],
            balance: 0,
            groupId,
          });

          // Nota: addAccount aggiorna lo stato internamente, non restituisce l'oggetto creato
          // Per il rollback, dovremo recuperare l'ID dal database se necessario
        }

        updateProgress(65, "Creazione budget...");

        // 3. Crea i budget
        for (let i = 0; i < data.budgets.length; i++) {
          const budgetData = data.budgets[i];
          const realPersonId = createdPeople.get(budgetData.personId);

          if (!realPersonId) {
            throw new Error(`Persona non trovata per il budget: ${budgetData.personId}`);
          }

          updateProgress(65 + (i / data.budgets.length) * 25, `Creazione budget: ${budgetData.description}`);

          await addBudget({
            description: budgetData.description,
            amount: budgetData.amount,
            categories: budgetData.categories,
            personId: realPersonId,
            period: "monthly",
          });

          // Nota: addBudget aggiorna lo stato internamente, non restituisce l'oggetto creato
          // Per il rollback, dovremo recuperare l'ID dal database se necessario
        }

        updateProgress(90, "Finalizzazione...");

        // 4. Refresh dei dati dell'applicazione
        await refreshData();

        updateProgress(100, "Completamento riuscito!");

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCompleted: true,
          currentOperation: "Onboarding completato con successo",
        }));

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          currentOperation: "Errore rilevato, avvio rollback...",
        }));

        // Esegui rollback
        await performRollback(rollbackData);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentOperation: "Rollback completato",
        }));

        return {
          success: false,
          error: errorMessage,
          rollbackData,
        };
      }
    },
    [client, user, addPerson, addAccount, addBudget, refreshData, updateProgress, performRollback]
  );

  /**
   * Reset dello stato
   */
  const resetCompletion = useCallback(() => {
    setState({
      isLoading: false,
      isCompleted: false,
      error: null,
      progress: 0,
      currentOperation: "",
    });
  }, []);

  return {
    ...state,
    completeOnboarding,
    resetCompletion,
  };
};
