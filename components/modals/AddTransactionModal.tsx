import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance, useModalForm } from '../../hooks';
import { TransactionType } from '../../types';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { CategoryUtils, CATEGORY_CONSTANTS } from '../../lib/utils/category.utils';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const AddTransactionModal = memo<AddTransactionModalProps>(({ isOpen, onClose }) => {
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Set initial account if available
      if (personAccounts.length > 0) {
        updateField('accountId', personAccounts[0].id);
      }
    }
  }, [isOpen, resetForm, personAccounts, updateField]);

  // Update accounts when person changes
  useEffect(() => {
    const newAccounts = accounts.filter(acc => acc.personIds.includes(data.txPersonId));
    if (newAccounts.length > 0 && !newAccounts.some(acc => acc.id === data.accountId)) {
      updateField('accountId', newAccounts[0].id);
    }
  }, [data.txPersonId, accounts, data.accountId, updateField]);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    // Basic required fields validation
    const requiredFields: Array<keyof TransactionFormData> = [
      'description', 'amount', 'accountId', 'category', 'date'
    ];

    if (!validateRequired(requiredFields)) {
      return false;
    }

    // Amount validation
    const numericAmount = parseFloat(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('amount', 'Inserisci un importo valido e positivo');
      return false;
    }

    // Transfer validation
    if (isTransfer) {
      const transferError = CategoryUtils.validateTransferData(data);
      if (transferError) {
        setError('toAccountId', transferError);
        return false;
      }
    }

    return true;
  }, [data, isTransfer, validateRequired, setError, clearAllErrors]);

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
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiunta della transazione');
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

  const submitError = errors.submit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi nuova transazione"
      error={submitError}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Person Selection (only in all view) */}
        {isAllView && (
          <FormField
            label="Persona"
            id="txPersonId"
            error={errors.txPersonId}
            required
          >
            <Select
              id="txPersonId"
              value={data.txPersonId}
              onChange={handleFieldChange('txPersonId')}
              options={personOptions}
              error={!!errors.txPersonId}
              placeholder="Seleziona persona"
            />
          </FormField>
        )}

        {/* Description */}
        <FormField
          label="Descrizione"
          id="description"
          error={errors.description}
          required
        >
          <Input
            type="text"
            id="description"
            value={data.description}
            onChange={handleFieldChange('description')}
            error={!!errors.description}
            placeholder="Descrizione della transazione"
          />
        </FormField>

        {/* Amount and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Importo (€)"
            id="amount"
            error={errors.amount}
            required
          >
            <Input
              type="number"
              id="amount"
              value={data.amount}
              onChange={handleFieldChange('amount')}
              error={!!errors.amount}
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </FormField>

          <FormField
            label="Data"
            id="date"
            error={errors.date}
            required
          >
            <Input
              type="date"
              id="date"
              value={data.date}
              onChange={handleFieldChange('date')}
              error={!!errors.date}
            />
          </FormField>
        </div>

        {/* Type and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Tipo"
            id="type"
            error={errors.type}
            required
          >
            <Select
              id="type"
              value={data.type}
              onChange={handleFieldChange('type')}
              options={[
                { value: TransactionType.ENTRATA, label: 'Entrata' },
                { value: TransactionType.SPESA, label: 'Spesa' },
              ]}
              error={!!errors.type}
              disabled={isTransfer}
            />
          </FormField>

          <FormField
            label="Categoria"
            id="category"
            error={errors.category}
            required
          >
            <Select
              id="category"
              value={data.category}
              onChange={handleFieldChange('category')}
              options={categoryOptions}
              error={!!errors.category}
              placeholder="Seleziona categoria"
            />
          </FormField>
        </div>

        {/* Account Selection */}
        <FormField
          label={isTransfer ? 'Account di origine' : 'Account'}
          id="accountId"
          error={errors.accountId}
          required
        >
          <Select
            id="accountId"
            value={data.accountId}
            onChange={handleFieldChange('accountId')}
            options={accountOptions}
            error={!!errors.accountId}
            placeholder="Seleziona account"
          />
        </FormField>

        {/* Transfer Destination Account */}
        {isTransfer && (
          <FormField
            label="Account di destinazione"
            id="toAccountId"
            error={errors.toAccountId}
            required
          >
            <Select
              id="toAccountId"
              value={data.toAccountId}
              onChange={handleFieldChange('toAccountId')}
              options={transferAccountOptions}
              error={!!errors.toAccountId}
              placeholder="Seleziona account di destinazione"
            />
          </FormField>
        )}

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="Aggiungi Transazione"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

AddTransactionModal.displayName = 'AddTransactionModal';
