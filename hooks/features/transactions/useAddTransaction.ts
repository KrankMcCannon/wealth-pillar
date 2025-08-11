import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { CATEGORY_CONSTANTS, CategoryUtils } from '../../../lib/utils/category.utils';
import { TransactionFormValidator } from '../../../lib/utils/transaction-form-validator.utils';
import { TransactionType } from '../../../types';

interface TransactionFormData {
  description: string;
  amount: string;
  date: string;
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId: string;
  txPersonId: string;
}

interface UseAddTransactionProps {
  onClose: () => void;
}

/**
 * Hook per gestire la logica di aggiunta transazioni
 * Estrae tutta la business logic dal componente UI
 */
export const useAddTransaction = ({ onClose }: UseAddTransactionProps) => {
  const { addTransaction, accounts, selectedPersonId, people, categories } = useFinance();

  const isAllView = selectedPersonId === 'all';

  // Initial form data
  const initialFormData: TransactionFormData = useMemo(() => ({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.SPESA,
    category: CATEGORY_CONSTANTS.DEFAULT_CATEGORY,
    accountId: '',
    toAccountId: '',
    txPersonId: isAllView ? (people[0]?.id || '') : selectedPersonId,
  }), [isAllView, people, selectedPersonId]);

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

  // Memoized computed values
  const currentPersonId = useMemo(() => 
    isAllView ? data.txPersonId : selectedPersonId
  , [isAllView, data.txPersonId, selectedPersonId]);

  const personAccounts = useMemo(() => 
    accounts.filter(acc => acc.personIds.includes(currentPersonId))
  , [accounts, currentPersonId]);

  const isTransfer = useMemo(() => 
    CategoryUtils.isTransfer({ category: data.category } as any)
  , [data.category]);

  const categoryOptions = useMemo(() => 
    CategoryUtils.toSelectOptions(categories)
  , [categories]);

  const accountOptions = useMemo(() => 
    personAccounts.map(acc => ({
      value: acc.id,
      label: acc.name,
    }))
  , [personAccounts]);

  const transferAccountOptions = useMemo(() => 
    personAccounts
      .filter(acc => acc.id !== data.accountId)
      .map(acc => ({
        value: acc.id,
        label: acc.name,
      }))
  , [personAccounts, data.accountId]);

  const personOptions = useMemo(() => 
    people.map(person => ({
      value: person.id,
      label: person.name,
    }))
  , [people]);

  const typeOptions = useMemo(() => [
    { value: TransactionType.ENTRATA, label: 'Entrata' },
    { value: TransactionType.SPESA, label: 'Spesa' },
  ], []);

  // Reset form when modal opens
  useEffect(() => {
    // Set initial account if available
    if (personAccounts.length > 0) {
      updateField('accountId', personAccounts[0].id);
    }
  }, [personAccounts, updateField]);

  // Update accounts when person changes
  useEffect(() => {
    const newAccounts = accounts.filter(acc => acc.personIds.includes(data.txPersonId));
    if (newAccounts.length > 0 && !newAccounts.some(acc => acc.id === data.accountId)) {
      updateField('accountId', newAccounts[0].id);
    }
  }, [data.txPersonId, accounts, data.accountId, updateField]);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    return TransactionFormValidator.validateTransactionForm(
      data,
      isTransfer,
      { setError, validateRequired, clearAllErrors }
    );
  }, [data, isTransfer, setError, validateRequired, clearAllErrors]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const transactionData: any = {
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        type: data.type,
        category: data.category,
        accountId: data.accountId,
        date: data.date,
      };

      // Add toAccountId only for transfers
      if (isTransfer) {
        transactionData.toAccountId = data.toAccountId;
      }

      await addTransaction(transactionData);
      onClose();
    } catch (err) {
      setError('general', err instanceof Error ? err.message : 'Errore durante l\'aggiunta della transazione');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, isTransfer, addTransaction, onClose, setError]);

  // Field change handlers
  const handleFieldChange = useCallback((field: keyof TransactionFormData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(field, e.target.value);
    }
  , [updateField]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return data.description.trim().length > 0 && 
           data.amount.trim().length > 0 && 
           parseFloat(data.amount) > 0 &&
           data.accountId.length > 0 &&
           (!isTransfer || data.toAccountId.length > 0) &&
           data.category.length > 0;
  }, [data, isTransfer]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,
    
    // Computed values
    isAllView,
    isTransfer,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    personOptions,
    typeOptions,
    
    // Event handlers
    handleSubmit,
    handleFieldChange,
  };
};
