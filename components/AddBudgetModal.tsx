import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance } from '../hooks/useFinance';
import { useModalForm } from '../hooks/useModalForm';
import { BaseModal } from './ui/BaseModal';
import { FormField, Input, CheckboxGroup, ModalActions } from './ui/FormComponents';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
}

interface BudgetFormData {
  description: string;
  amount: string;
  selectedCategories: string[];
}

export const AddBudgetModal = memo<AddBudgetModalProps>(({ isOpen, onClose, personId }) => {
  const { addBudget, categories } = useFinance();

  const initialFormData: BudgetFormData = useMemo(() => ({
    description: '',
    amount: '',
    selectedCategories: [],
  }), []);

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
    resetOnClose: true,
    resetOnOpen: true,
  });

  // Filter categories excluding income categories
  const expenseCategories = useMemo(() => 
    categories.filter(cat => 
      !['stipendio', 'investimenti', 'entrata', 'trasferimento'].includes(cat.id)
    )
  , [categories]);

  // Category checkbox options
  const categoryOptions = useMemo(() => 
    expenseCategories.map(category => ({
      id: category.id,
      label: category.label || category.name,
      checked: data.selectedCategories.includes(category.id),
    }))
  , [expenseCategories, data.selectedCategories]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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

    const numericAmount = parseFloat(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('amount', 'Inserisci un importo valido e positivo');
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
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await addBudget({
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        categories: data.selectedCategories,
        period: 'monthly',
        personId,
      });
      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiunta del budget');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, addBudget, personId, onClose, setError]);

  // Field change handlers
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('description', e.target.value);
  }, [updateField]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('amount', e.target.value);
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
      title="Aggiungi Nuovo Budget"
      error={submitError}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <FormField
          label="Descrizione"
          id="budget-description"
          error={errors.description}
          required
        >
          <Input
            type="text"
            id="budget-description"
            value={data.description}
            onChange={handleDescriptionChange}
            error={!!errors.description}
            placeholder="es: Spese Essenziali, Intrattenimento, Cura Personale"
          />
        </FormField>

        {/* Amount */}
        <FormField
          label="Importo Mensile (€)"
          id="budget-amount"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            id="budget-amount"
            value={data.amount}
            onChange={handleAmountChange}
            error={!!errors.amount}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </FormField>

        {/* Categories */}
        <FormField
          label="Categorie Associate"
          id="categories-selection"
          error={errors.selectedCategories}
          required
        >
          <CheckboxGroup
            options={categoryOptions}
            onChange={handleCategoryToggle}
            columns={2}
            maxHeight="16rem"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Selezionate: {data.selectedCategories.length} categorie
          </p>
        </FormField>

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="Aggiungi Budget"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

AddBudgetModal.displayName = 'AddBudgetModal';
