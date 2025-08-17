import { useCallback, useMemo, useState } from "react";
import type { OnboardingBudget, OnboardingPerson } from "../../../types";

/**
 * Hook per gestire il form dei budget nell'onboarding
 * Principio SRP: Si occupa solo della gestione dei budget
 * Principio DRY: Centralizza la logica di validazione dei budget
 */
export const useOnboardingBudgetsForm = (people: OnboardingPerson[]) => {
  // Inizializza con un budget per ogni persona
  const [budgets, setBudgets] = useState<OnboardingBudget[]>(() => {
    return people.map((person) => ({
      description: "",
      amount: 0,
      categories: [],
      personId: person.name, // Usiamo il nome come ID temporaneo
    }));
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Categorie di spesa disponibili (formato per il componente)
  const expenseCategories = [
    { name: "Alimentari", label: "Alimentari" },
    { name: "Casa", label: "Casa" },
    { name: "Trasporti", label: "Trasporti" },
    { name: "Salute", label: "Salute" },
    { name: "Intrattenimento", label: "Intrattenimento" },
    { name: "Abbigliamento", label: "Abbigliamento" },
    { name: "Ristoranti", label: "Ristoranti" },
    { name: "Viaggi", label: "Viaggi" },
    { name: "Sport", label: "Sport" },
    { name: "Shopping", label: "Shopping" },
    { name: "Bollette", label: "Bollette" },
    { name: "Benzina", label: "Benzina" },
    { name: "Regali", label: "Regali" },
    { name: "Altro", label: "Altro" },
  ];

  /**
   * Raggruppa i budget per persona e restituisce array di oggetti per il componente
   */
  const budgetsByPerson = useMemo(() => {
    return people.map((person) => {
      const personBudgets = budgets
        .map((budget, globalIndex) => ({ ...budget, index: globalIndex })) // Usa indice globale
        .filter((budget) => budget.personId === person.name);

      return {
        person,
        budgets: personBudgets,
      };
    });
  }, [people, budgets]);

  /**
   * Aggiunge un nuovo budget per una persona specifica
   */
  const addBudget = useCallback((personId: string) => {
    const newBudget: OnboardingBudget = {
      description: "",
      amount: 0,
      categories: [],
      personId,
    };

    setBudgets((prev) => [...prev, newBudget]);
  }, []);

  /**
   * Rimuove un budget specifico
   */
  const removeBudget = useCallback((personId: string, budgetIndex: number) => {
    setBudgets((prev) => {
      const personBudgets = prev.filter((budget) => budget.personId === personId);
      if (personBudgets.length <= 1) return prev; // Mantieni almeno un budget per persona

      let currentIndex = 0;
      return prev.filter((budget) => {
        if (budget.personId === personId) {
          if (currentIndex === budgetIndex) {
            currentIndex++;
            return false; // Rimuovi questo budget
          }
          currentIndex++;
        }
        return true;
      });
    });

    // Rimuovi errori associati
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${personId}_budget_${budgetIndex}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  /**
   * Aggiorna un campo di un budget specifico usando l'indice globale
   */
  const updateBudgetByGlobalIndex = useCallback(
    (globalIndex: number, field: keyof Omit<OnboardingBudget, "personId">, value: any) => {
      setBudgets((prev) =>
        prev.map((budget, index) => (index === globalIndex ? { ...budget, [field]: value } : budget))
      );

      // Pulisci errori per questo campo
      const budget = budgets[globalIndex];
      if (budget) {
        const personBudgets = budgets.filter((b) => b.personId === budget.personId);
        const localIndex = personBudgets.findIndex((b) => b === budget);
        const errorKey = `${budget.personId}_budget_${localIndex}_${field}`;
        setValidationErrors((prev) => {
          if (!prev[errorKey]) return prev;
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [budgets]
  );

  /**
   * Aggiorna un campo di un budget specifico (compatibilità con componente)
   */
  const updateBudget = useCallback(
    (budgetIndex: number, field: keyof Omit<OnboardingBudget, "personId">, value: any) => {
      updateBudgetByGlobalIndex(budgetIndex, field, value);
    },
    [updateBudgetByGlobalIndex]
  );

  /**
   * Gestisce la selezione/deselezione di una categoria per un budget
   */
  const handleCategoryToggle = useCallback(
    (budgetIndex: number, category: string, isSelected: boolean) => {
      setBudgets((prev) =>
        prev.map((budget, index) => {
          if (index === budgetIndex) {
            const newCategories = isSelected
              ? [...budget.categories, category]
              : budget.categories.filter((c) => c !== category);
            return { ...budget, categories: newCategories };
          }
          return budget;
        })
      );

      // Pulisci errore categorie se ne è stata selezionata almeno una
      const budget = budgets[budgetIndex];
      if (budget && isSelected) {
        const personBudgets = budgets.filter((b) => b.personId === budget.personId);
        const localIndex = personBudgets.findIndex((b) => b === budget);
        const errorKey = `${budget.personId}_budget_${localIndex}_categories`;
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [budgets]
  );

  /**
   * Valida tutti i budget
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    people.forEach((person) => {
      const personBudgets = budgets.filter((budget) => budget.personId === person.name);

      if (personBudgets.length === 0) {
        errors[`${person.name}_no_budgets`] = `${person.name} deve avere almeno un budget`;
        return;
      }

      personBudgets.forEach((budget, index) => {
        const descKey = `${person.name}_budget_${index}_description`;
        const amountKey = `${person.name}_budget_${index}_amount`;
        const categoriesKey = `${person.name}_budget_${index}_categories`;

        // Validazione descrizione
        if (!budget.description?.trim()) {
          errors[descKey] = "La descrizione del budget è obbligatoria";
        } else if (budget.description.trim().length < 3) {
          errors[descKey] = "La descrizione deve essere di almeno 3 caratteri";
        } else if (budget.description.trim().length > 50) {
          errors[descKey] = "La descrizione non può superare i 50 caratteri";
        }

        // Validazione importo
        if (!budget.amount || budget.amount <= 0) {
          errors[amountKey] = "L'importo deve essere maggiore di zero";
        } else if (budget.amount > 50000) {
          errors[amountKey] = "L'importo non può superare i 50.000€";
        }

        // Validazione categorie
        if (!budget.categories || budget.categories.length === 0) {
          errors[categoriesKey] = "È necessario selezionare almeno una categoria";
        }

        // Controllo duplicati descrizioni per la stessa persona
        const duplicateInSamePerson = personBudgets.find(
          (otherBudget, otherIndex) =>
            otherIndex !== index &&
            otherBudget.description.trim().toLowerCase() === budget.description.trim().toLowerCase() &&
            budget.description.trim() !== ""
        );

        if (duplicateInSamePerson) {
          errors[descKey] = "Descrizione budget già utilizzata per questa persona";
        }
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [budgets, people]);

  /**
   * Controlla se il form può essere sottomesso
   */
  const canSubmit = useMemo(() => {
    // Ogni persona deve avere almeno un budget valido
    return people.every((person) => {
      const personBudgets = budgets.filter((budget) => budget.personId === person.name);
      return (
        personBudgets.length > 0 &&
        personBudgets.some(
          (budget) => budget.description.trim().length > 0 && budget.amount > 0 && budget.categories.length > 0
        )
      );
    });
  }, [budgets, people]);

  /**
   * Budget validi pronti per l'invio
   */
  const validBudgets = useMemo(() => {
    return budgets
      .filter((budget) => budget.description.trim().length > 0 && budget.amount > 0 && budget.categories.length > 0)
      .map((budget) => ({
        ...budget,
        description: budget.description.trim(),
      }));
  }, [budgets]);

  return {
    budgets,
    budgetsByPerson,
    expenseCategories,
    validationErrors,
    addBudget,
    removeBudget,
    updateBudget,
    handleCategoryToggle,
    validateForm,
    canSubmit,
    validBudgets,
  };
};
