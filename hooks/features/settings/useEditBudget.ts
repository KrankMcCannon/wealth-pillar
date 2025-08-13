import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { Budget } from '../../../types';

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
    validateRequired,
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

  // Computed values
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

  // Validation
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['description', 'amount'])) {
      return false;
    }

    if (data.description.trim().length === 0) {
      setError('description', 'La descrizione non può essere vuota');
      return false;
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('amount', 'L\'importo deve essere un numero positivo');
      return false;
    }

    if (data.selectedCategories.length === 0) {
      setError('selectedCategories', 'Seleziona almeno una categoria');
      return false;
    }

    const startDay = parseInt(data.budgetStartDay);
    if (isNaN(startDay) || startDay < 1 || startDay > 28) {
      setError('budgetStartDay', 'Il giorno di inizio deve essere tra 1 e 28');
      return false;
    }

    return true;
  }, [data, validateRequired, setError, clearAllErrors]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !budget) {
      return;
    }

    setSubmitting(true);

    try {
      // Update budget
      const updatedBudget: Budget = {
        ...budget,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        categories: data.selectedCategories,
      };

      await updateBudget(updatedBudget);

      // Update person's budget start date if changed
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

  // Field change handlers
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

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return data.description.trim().length > 0 && 
           data.amount.trim().length > 0 && 
           parseFloat(data.amount) > 0 &&
           data.selectedCategories.length > 0;
  }, [data]);

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
