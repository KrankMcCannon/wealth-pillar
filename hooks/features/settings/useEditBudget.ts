import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { Budget } from '../../../types';
import { validateEditBudgetForm } from '../../utils/validators';

interface EditBudgetFormData {
  description: string;
  amount: string;
  selectedCategories: string[];
  budgetStartDay: string;
}

interface UseEditBudgetProps {
  budget: Budget | null;
  onClose: () => void;
}

/**
 * Hook per gestire la logica di editing dei budget
 * Estrae tutta la business logic dal componente UI
 */
export const useEditBudget = ({ budget, onClose }: UseEditBudgetProps) => {
  const { updateBudget, categories, getPersonById, updatePerson } = useFinance();

  // Initial form data from budget
  const initialFormData: EditBudgetFormData = useMemo(() => {
    if (!budget) {
      return {
        description: '',
        amount: '',
        selectedCategories: [],
        budgetStartDay: '1',
      };
    }

    const person = getPersonById(budget.personId);
    return {
      description: budget.description,
      amount: budget.amount.toString(),
      selectedCategories: budget.categories,
      budgetStartDay: person?.budgetStartDate || '1',
    };
  }, [budget, getPersonById]);

  const {
    data,
    errors,
    isSubmitting,
    updateField,
    setError,
    clearAllErrors,
    setSubmitting,
    resetForm,
  } = useModalForm({
    initialData: initialFormData,
    resetOnClose: false,
    resetOnOpen: false,
  });

  // Reset form data when budget changes
  useEffect(() => {
    if (budget) {
      resetForm();
    }
  }, [budget, resetForm]);

  const categoryOptions = useMemo(() =>
    categories.map(category => ({
      id: category.id,
      label: category.label || category.name,
      checked: data.selectedCategories.includes(category.id),
    }))
    , [categories, data.selectedCategories]);

  const budgetStartDayOptions = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `Giorno ${i + 1}`,
    }))
    , []);

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = validateEditBudgetForm({
      description: data.description,
      amount: data.amount,
      selectedCategories: data.selectedCategories,
      budgetStartDay: data.budgetStartDay,
    });
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !budget) {
      return;
    }

    setSubmitting(true);

    try {
      const updatedBudget: Budget = {
        ...budget,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        categories: data.selectedCategories,
      };

      await updateBudget(updatedBudget);

      const person = getPersonById(budget.personId);
      if (person && person.budgetStartDate !== data.budgetStartDay) {
        await updatePerson({
          ...person,
          budgetStartDate: data.budgetStartDay,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to update budget:', error);
      setError('general', 'Errore nel salvataggio. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, budget, updateBudget, getPersonById, updatePerson, onClose, setError]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('description', e.target.value);
  }, [updateField]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('amount', e.target.value);
  }, [updateField]);

  const handleBudgetStartDayChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField('budgetStartDay', e.target.value);
  }, [updateField]);

  const handleCategoryToggle = useCallback((categoryValue: string, checked: boolean) => {
    const currentCategories = data.selectedCategories;
    if (checked) {
      updateField('selectedCategories', [...currentCategories, categoryValue]);
    } else {
      updateField('selectedCategories', currentCategories.filter(cat => cat !== categoryValue));
    }
  }, [data.selectedCategories, updateField]);

  const canSubmit = useMemo(() => {
    return budget !== null && Object.keys(validateEditBudgetForm({
      description: data.description,
      amount: data.amount,
      selectedCategories: data.selectedCategories,
      budgetStartDay: data.budgetStartDay,
    })).length === 0;
  }, [data, budget]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,

    // Computed values
    categoryOptions,
    budgetStartDayOptions,

    // Event handlers
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleBudgetStartDayChange,
    handleCategoryToggle,
  };
};
