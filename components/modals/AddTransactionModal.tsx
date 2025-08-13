import React, { memo } from 'react';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { useAddTransaction } from '../../hooks/features/transactions/useAddTransaction';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente presentazionale per aggiunta transazioni
 * Tutta la logica è delegata al hook useAddTransaction
 */
export const AddTransactionModal = memo<AddTransactionModalProps>(({ isOpen, onClose }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    isAllView,
    isTransfer,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    personOptions,
    typeOptions,
    handleSubmit,
    handleFieldChange,
  } = useAddTransaction({ onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi nuova transazione"
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
              disabled={isSubmitting}
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
            disabled={isSubmitting}
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
              disabled={isSubmitting}
              min="0"
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              placeholder="Seleziona tipo"
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
              disabled={isSubmitting}
              placeholder="Seleziona categoria"
            />
          </FormField>
        </div>

        {/* Account */}
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
            disabled={isSubmitting}
            placeholder="Seleziona account"
          />
        </FormField>

        {/* To Account (only for transfers) */}
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
              disabled={isSubmitting}
              placeholder="Seleziona account destinazione"
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
          submitLabel="Aggiungi Transazione"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AddTransactionModal.displayName = 'AddTransactionModal';
