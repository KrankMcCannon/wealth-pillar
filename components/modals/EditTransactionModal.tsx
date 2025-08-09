import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { useModalForm } from '../../hooks/useModalForm';
import { Transaction, TransactionType } from '../../types';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

interface EditTransactionFormData {
  description: string;
  amount: string;
  date: string;
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId: string;
}

export const EditTransactionModal = memo<EditTransactionModalProps>(({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const { updateTransaction, accounts, categories, selectedPersonId } = useFinance();

  const isAllView = selectedPersonId === 'all';

  // Initial form data from transaction
  const initialFormData: EditTransactionFormData = useMemo(() => ({
    description: transaction.description,
    amount: transaction.amount.toString(),
    date: transaction.date.split('T')[0],
    type: transaction.type,
    category: transaction.category,
    accountId: transaction.accountId,
    toAccountId: transaction.toAccountId || '',
  }), [transaction]);

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

  // Reset form data when transaction changes
  useEffect(() => {
    if (transaction) {
      resetForm();
    }
  }, [transaction, resetForm]);

  // Memoized computed values
  const isTransfer = useMemo(() => 
    data.category === 'trasferimento'
  , [data.category]);

  const categoryOptions = useMemo(() => 
    categories.map(cat => ({
      value: cat.name,
      label: cat.label || cat.name,
    }))
  , [categories]);

  const accountOptions = useMemo(() => 
    accounts.map(acc => ({
      value: acc.id,
      label: acc.name,
    }))
  , [accounts]);

  const transferAccountOptions = useMemo(() => 
    accounts
      .filter(acc => acc.id !== data.accountId)
      .map(acc => ({
        value: acc.id,
        label: acc.name,
      }))
  , [accounts, data.accountId]);

  const typeOptions = useMemo(() => [
    { value: TransactionType.ENTRATA, label: 'Entrata' },
    { value: TransactionType.SPESA, label: 'Spesa' },
  ], []);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    const requiredFields: Array<keyof EditTransactionFormData> = [
      'description', 'amount', 'accountId', 'category', 'date'
    ];

    if (!validateRequired(requiredFields)) {
      return false;
    }

    // Amount validation
    const numericAmount = parseFloat(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('amount', 'L\'importo deve essere un numero positivo');
      return false;
    }

    // Transfer validation
    if (isTransfer) {
      if (!data.toAccountId) {
        setError('toAccountId', 'Seleziona l\'account di destinazione per il trasferimento');
        return false;
      }
      if (data.accountId === data.toAccountId) {
        setError('toAccountId', 'L\'account di origine e destinazione devono essere diversi');
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
      const updatedTransaction: Transaction = {
        ...transaction,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        date: data.date,
        type: data.type,
        category: data.category,
        accountId: data.accountId,
        toAccountId: isTransfer ? data.toAccountId : undefined,
      };

      await updateTransaction(updatedTransaction);
      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiornamento della transazione');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, isTransfer, transaction, updateTransaction, onClose, setError]);

  // Field change handlers
  const handleFieldChange = useCallback((field: keyof EditTransactionFormData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(field, e.target.value);
    }
  , [updateField]);

  const submitError = errors.submit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Transazione"
      error={submitError}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              options={typeOptions}
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
          submitText="Aggiorna Transazione"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

EditTransactionModal.displayName = 'EditTransactionModal';