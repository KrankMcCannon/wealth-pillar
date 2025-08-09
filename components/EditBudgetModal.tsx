import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance } from '../hooks/useFinance';
import { useModalForm } from '../hooks/useModalForm';
import { Budget } from '../types';
import { BaseModal } from './ui/BaseModal';
import { FormField, Input, Select, CheckboxGroup, ModalActions } from './ui/FormComponents';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
}

interface EditBudgetFormData {
  description: string;
  amount: string;
  selectedCategories: string[];
  budgetStartDay: string;
}

export const EditBudgetModal = memo<EditBudgetModalProps>(({ isOpen, onClose, budget }) => {
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
    resetOnClose: false, // We handle reset manually for edit modals
    resetOnOpen: false,
  });

  // Reset form data when budget changes
  useEffect(() => {
    if (budget) {
      resetForm();
    }
  }, [budget, resetForm]);

  // Category checkbox options
  const categoryOptions = useMemo(() => 
    categories.map(category => ({
      id: category.id,
      label: category.label || category.name,
      checked: data.selectedCategories.includes(category.id),
    }))
  , [categories, data.selectedCategories]);

  // Budget start day options (1-28)
  const budgetStartDayOptions = useMemo(() => 
    Array.from({ length: 28 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `Giorno ${i + 1}`,
    }))
  , []);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['description', 'amount'])) {
      return false;
    }

    if (data.description.trim().length === 0) {
      setError('description', 'La descrizione non può essere vuota');
      return false;
    }

    const amountValue = parseFloat(data.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('amount', 'Inserisci un importo valido');
      return false;
    }

    if (data.selectedCategories.length === 0) {
      setError('selectedCategories', 'Seleziona almeno una categoria');
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

    try {
      // Validate budget start day
      const startDay = parseInt(data.budgetStartDay);
      if (isNaN(startDay) || startDay < 1 || startDay > 28) {
        setError('budgetStartDay', 'Inserisci un giorno valido tra 1 e 28');
        return;
      }

      // Update the budget
      await updateBudget({
        ...budget,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        categories: data.selectedCategories
      });

      // Update the person's budget start date if it changed
      const person = getPersonById(budget.personId);
      if (person && person.budgetStartDate !== data.budgetStartDay) {
        await updatePerson({
          ...person,
          budgetStartDate: data.budgetStartDay
        });
      }

      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del budget');
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

  const handleBudgetStartDayChange = useCallback((value: string) => {
    updateField('budgetStartDay', value);
  }, [updateField]);

  const handleCategoryToggle = useCallback((categoryId: string, checked: boolean) => {
    const newSelectedCategories = checked
      ? [...data.selectedCategories, categoryId]
      : data.selectedCategories.filter(id => id !== categoryId);
    
    updateField('selectedCategories', newSelectedCategories);
  }, [data.selectedCategories, updateField]);

  const submitError = errors.submit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Budget"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description field */}
        <FormField
          label="Descrizione"
          error={errors.description}
          required
        >
          <Input
            value={data.description}
            onChange={handleDescriptionChange}
            placeholder="es: Spese essenziali"
            error={!!errors.description}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Amount field */}
        <FormField
          label="Importo"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            value={data.amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            error={!!errors.amount}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Budget start day field */}
        <FormField
          label="Giorno di inizio budget"
          error={errors.budgetStartDay}
          required
        >
          <Select
            value={data.budgetStartDay}
            onValueChange={handleBudgetStartDayChange}
            options={budgetStartDayOptions}
            placeholder="Seleziona il giorno"
            error={!!errors.budgetStartDay}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Categories selection */}
        <FormField
          label="Categorie"
          error={errors.selectedCategories}
          required
        >
          <CheckboxGroup
            options={categoryOptions}
            onToggle={handleCategoryToggle}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Submit error */}
        {submitError && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Aggiorna Budget"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

EditBudgetModal.displayName = 'EditBudgetModal';