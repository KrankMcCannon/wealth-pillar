import { useCallback, useMemo } from "react";
import { useModalForm } from "../../ui/useModalForm";
import { BudgetService, BudgetFormData } from "../../../lib/services/budget.service";
import { useFinance } from "../../core/useFinance";

interface UseBudgetFormOptions {
  initialData?: Partial<BudgetFormData>;
  personId: string;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => Promise<void>;
}

/**
 * Hook riutilizzabile per i form dei budget
 * Gestisce validazione, stato e handlers comuni
 */
export const useBudgetForm = (options: UseBudgetFormOptions) => {
  const { initialData, personId, onClose, onSubmit } = options;
  const { categories } = useFinance();

  const defaultFormData: BudgetFormData = useMemo(
    () => ({
      description: "",
      amount: 0,
      categories: [],
      personId,
      ...initialData,
    }),
    [personId, initialData]
  );

  const { data, errors, isSubmitting, updateField, setError, clearAllErrors, setSubmitting, resetForm } = useModalForm({
    initialData: defaultFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  // Categorie di spesa filtrate
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

  // Validazione
  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = BudgetService.validateBudgetData(data);
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError]);

  // Submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        await onSubmit(data);
        onClose();
      } catch (err) {
        setError("general", err instanceof Error ? err.message : "Errore durante il salvataggio");
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, setSubmitting, data, onSubmit, onClose, setError]
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
