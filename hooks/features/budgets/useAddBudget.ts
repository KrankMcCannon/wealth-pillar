import React, { useCallback, useMemo } from "react";
import { useFinance, useModalForm } from "../../";
import { BudgetService, BudgetFormData } from "../../../lib/services/budget.service";

interface UseAddBudgetProps {
  personId: string;
  onClose: () => void;
}

/**
 * Hook semplificato per aggiungere budget
 * Utilizza BudgetService per validazione e logica
 */
export const useAddBudget = ({ personId, onClose }: UseAddBudgetProps) => {
  const { addBudget, categories } = useFinance();

  const initialFormData: BudgetFormData = useMemo(
    () => ({
      description: "",
      amount: 0,
      categories: [],
      personId,
    }),
    [personId]
  );

  const { data, errors, isSubmitting, updateField, setError, clearAllErrors, setSubmitting, resetForm } = useModalForm({
    initialData: initialFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  // Filtra categorie di spesa
  const expenseCategories = useMemo(
    () => categories.filter((cat) => !["stipendio", "investimenti", "entrata", "trasferimento"].includes(cat.id)),
    [categories]
  );

  // Opzioni categorie per UI
  const categoryOptions = useMemo(
    () =>
      expenseCategories.map((category) => ({
        id: category.id,
        label: category.label || category.name,
        checked: data.categories.includes(category.id),
      })),
    [expenseCategories, data.categories]
  );

  // Validazione usando BudgetService
  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = BudgetService.validateBudgetData(data);
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError]);

  // Submit form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        await addBudget({
          description: data.description.trim(),
          amount: data.amount,
          categories: data.categories,
          period: "monthly",
          personId,
        });
        onClose();
      } catch (err) {
        setError("general", err instanceof Error ? err.message : "Errore durante l'aggiunta del budget");
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, setSubmitting, data, addBudget, personId, onClose, setError]
  );

  // Handlers per i campi
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("description", e.target.value);
    },
    [updateField]
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("amount", parseFloat(e.target.value) || 0);
    },
    [updateField]
  );

  const handleCategoryToggle = useCallback(
    (categoryId: string, checked: boolean) => {
      const newCategories = checked
        ? [...data.categories, categoryId]
        : data.categories.filter((id) => id !== categoryId);

      updateField("categories", newCategories);
    },
    [data.categories, updateField]
  );

  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // Controllo se può essere inviato
  const canSubmit = useMemo(() => {
    return Object.keys(BudgetService.validateBudgetData(data)).length === 0;
  }, [data]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,

    // Computed values
    categoryOptions,

    // Event handlers
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleCategoryToggle,
    handleReset,
  };
};
