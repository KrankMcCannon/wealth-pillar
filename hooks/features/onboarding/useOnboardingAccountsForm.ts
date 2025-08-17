import { useCallback, useMemo, useState } from "react";
import type { OnboardingAccount, OnboardingPerson } from "../../../types";

/**
 * Hook per gestire il form degli account nell'onboarding
 * Principio SRP: Si occupa solo della gestione degli account
 * Principio DRY: Centralizza la logica di validazione degli account
 */
export const useOnboardingAccountsForm = (people: OnboardingPerson[]) => {
  // Inizializza con un account per ogni persona
  const [accounts, setAccounts] = useState<OnboardingAccount[]>(() => {
    return people.map((person) => ({
      name: "",
      type: "stipendio" as const,
      personId: person.name, // Usiamo il nome come ID temporaneo
    }));
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Tipi di account disponibili
  const accountTypes = [
    { value: "stipendio", label: "Conto Stipendio" },
    { value: "risparmio", label: "Conto Risparmio" },
    { value: "contanti", label: "Contanti" },
    { value: "investimenti", label: "Investimenti" },
  ];

  /**
   * Raggruppa gli account per persona e restituisce array di oggetti per il componente
   */
  const accountsByPerson = useMemo(() => {
    return people.map((person) => {
      const personAccounts = accounts
        .map((account, globalIndex) => ({ ...account, index: globalIndex })) // Usa indice globale
        .filter((account) => account.personId === person.name);

      return {
        person,
        accounts: personAccounts,
      };
    });
  }, [people, accounts]);

  /**
   * Aggiunge un nuovo account per una persona specifica
   */
  const addAccount = useCallback((personId: string) => {
    const newAccount: OnboardingAccount = {
      name: "",
      type: "stipendio",
      personId,
    };

    setAccounts((prev) => [...prev, newAccount]);
  }, []);

  /**
   * Rimuove un account specifico usando l'indice globale
   */
  const removeAccountByGlobalIndex = useCallback(
    (globalIndex: number) => {
      const accountToRemove = accounts[globalIndex];
      if (!accountToRemove) return;

      const personAccounts = accounts.filter((acc) => acc.personId === accountToRemove.personId);
      if (personAccounts.length <= 1) return; // Mantieni almeno un account per persona

      setAccounts((prev) => prev.filter((_, index) => index !== globalIndex));

      // Rimuovi errori associati
      const localIndex = personAccounts.findIndex((acc) => acc === accountToRemove);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${accountToRemove.personId}_account_${localIndex}_name`];
        delete newErrors[`${accountToRemove.personId}_account_${localIndex}_type`];
        return newErrors;
      });
    },
    [accounts]
  );

  /**
   * Rimuove un account specifico (compatibilità con componente)
   */
  const removeAccount = useCallback(
    (accountIndex: number) => {
      removeAccountByGlobalIndex(accountIndex);
    },
    [removeAccountByGlobalIndex]
  );

  /**
   * Aggiorna un campo di un account specifico usando l'indice globale
   */
  const updateAccountByGlobalIndex = useCallback(
    (globalIndex: number, field: keyof Omit<OnboardingAccount, "personId">, value: string) => {
      setAccounts((prev) =>
        prev.map((account, index) => (index === globalIndex ? { ...account, [field]: value } : account))
      );

      // Pulisci errori per questo campo
      const account = accounts[globalIndex];
      if (account) {
        const personAccounts = accounts.filter((acc) => acc.personId === account.personId);
        const localIndex = personAccounts.findIndex((acc) => acc === account);
        const errorKey = `${account.personId}_account_${localIndex}_${field}`;
        setValidationErrors((prev) => {
          if (!prev[errorKey]) return prev;
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [accounts]
  );

  /**
   * Aggiorna un campo di un account specifico (compatibilità con componente)
   */
  const updateAccount = useCallback(
    (accountIndex: number, field: keyof Omit<OnboardingAccount, "personId">, value: string) => {
      updateAccountByGlobalIndex(accountIndex, field, value);
    },
    [updateAccountByGlobalIndex]
  );

  /**
   * Valida tutti gli account
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    people.forEach((person) => {
      const personAccounts = accounts.filter((acc) => acc.personId === person.name);

      if (personAccounts.length === 0) {
        errors[`${person.name}_no_accounts`] = `${person.name} deve avere almeno un account`;
        return;
      }

      personAccounts.forEach((account, index) => {
        const nameKey = `${person.name}_account_${index}_name`;
        const typeKey = `${person.name}_account_${index}_type`;

        // Validazione nome account
        if (!account.name?.trim()) {
          errors[nameKey] = "Il nome dell'account è obbligatorio";
        } else if (account.name.trim().length < 2) {
          errors[nameKey] = "Il nome dell'account deve essere di almeno 2 caratteri";
        } else if (account.name.trim().length > 30) {
          errors[nameKey] = "Il nome dell'account non può superare i 30 caratteri";
        }

        // Validazione tipo account
        if (!account.type) {
          errors[typeKey] = "Il tipo di account è obbligatorio";
        }

        // Controllo duplicati nomi account per la stessa persona
        const duplicateInSamePerson = personAccounts.find(
          (otherAccount, otherIndex) =>
            otherIndex !== index &&
            otherAccount.name.trim().toLowerCase() === account.name.trim().toLowerCase() &&
            account.name.trim() !== ""
        );

        if (duplicateInSamePerson) {
          errors[nameKey] = "Nome account già utilizzato per questa persona";
        }
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [accounts, people]);

  /**
   * Controlla se il form può essere sottomesso
   */
  const canSubmit = useMemo(() => {
    // Ogni persona deve avere almeno un account con nome valido
    return people.every((person) => {
      const personAccounts = accounts.filter((acc) => acc.personId === person.name);
      return personAccounts.length > 0 && personAccounts.some((acc) => acc.name.trim().length > 0);
    });
  }, [accounts, people]);

  /**
   * Account validi pronti per l'invio
   */
  const validAccounts = useMemo(() => {
    return accounts
      .filter((account) => account.name.trim().length > 0)
      .map((account) => ({
        ...account,
        name: account.name.trim(),
      }));
  }, [accounts]);

  return {
    accounts,
    accountsByPerson,
    accountTypes,
    validationErrors,
    addAccount,
    removeAccount,
    updateAccount,
    validateForm,
    canSubmit,
    validAccounts,
  };
};
