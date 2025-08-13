import React, { memo } from 'react';
import { Transaction } from '../../types';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { useEditTransaction } from '../../hooks/features/transactions/useEditTransaction';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

/**
 * Componente presentazionale per editing transazioni
 * Tutta la logica è delegata al hook useEditTransaction
 */
export const EditTransactionModal = memo<EditTransactionModalProps>(({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    accountOptions,
    categoryOptions,
    transferAccountOptions,
    typeOptions,
    showToAccount,
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleDateChange,
    handleTypeChange,
    handleCategoryChange,
    handleAccountChange,
    handleToAccountChange,
  } = useEditTransaction({ transaction, onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Transazione"
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
            placeholder="Inserisci la descrizione"
            error={!!errors.description}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Amount field */}
        <FormField
          label="Importo (€)"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            error={!!errors.amount}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Date field */}
        <FormField
          label="Data"
          error={errors.date}
          required
        >
          <Input
            type="date"
            value={data.date}
            onChange={handleDateChange}
            error={!!errors.date}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Type field */}
        <FormField
          label="Tipo"
          error={errors.type}
          required
        >
          <Select
            value={data.type}
            onChange={handleTypeChange}
            error={!!errors.type}
            disabled={isSubmitting}
            options={typeOptions}
            placeholder="Seleziona tipo"
          />
        </FormField>

        {/* Category field */}
        <FormField
          label="Categoria"
          error={errors.category}
          required
        >
          <Select
            value={data.category}
            onChange={handleCategoryChange}
            error={!!errors.category}
            disabled={isSubmitting}
            options={categoryOptions}
            placeholder="Seleziona categoria"
          />
        </FormField>

        {/* Account field */}
        <FormField
          label="Conto"
          error={errors.accountId}
          required
        >
          <Select
            value={data.accountId}
            onChange={handleAccountChange}
            error={!!errors.accountId}
            disabled={isSubmitting}
            options={accountOptions}
            placeholder="Seleziona conto"
          />
        </FormField>

        {/* To Account field - shown only for transfers */}
        {showToAccount && (
          <FormField
            label="Conto Destinazione"
            error={errors.toAccountId}
            required
          >
            <Select
              value={data.toAccountId}
              onChange={handleToAccountChange}
              error={!!errors.toAccountId}
              disabled={isSubmitting}
              options={transferAccountOptions}
              placeholder="Seleziona conto destinazione"
            />
          </FormField>
        )}

        {/* Submit error */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Salva Modifiche"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

EditTransactionModal.displayName = 'EditTransactionModal';
