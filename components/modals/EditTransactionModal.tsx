import { memo } from 'react';
import { Transaction } from '../../types';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { useTransactions } from '../../hooks';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

/**
 * Componente presentazionale per editing transazioni
 */
export const EditTransactionModal = memo<EditTransactionModalProps>(({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const {
    editTransactionForm: {
      data,
      errors,
      isSubmitting,
      canSubmit,
      accountOptions,
      categoryOptions,
      transferAccountOptions,
      typeOptions,
      showToAccount,
      updateField,
      handleSubmit,
    },
  } = useTransactions();

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, transaction, onClose);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Transazione"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Description field */}
        <FormField
          id="transaction-description"
          label="Descrizione"
          error={errors.description}
          required
        >
          <Input
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Inserisci la descrizione"
            error={!!errors.description}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Amount field */}
        <FormField
          id="transaction-amount"
          label="Importo (€)"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.amount}
            onChange={(e) => updateField('amount', Number(e.target.value))}
            placeholder="0.00"
            error={!!errors.amount}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Date field */}
        <FormField
          id="transaction-date"
          label="Data"
          error={errors.date}
          required
        >
          <Input
            type="date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            error={!!errors.date}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Type field */}
        <FormField
          id="transaction-type"
          label="Tipo"
          error={errors.type}
          required
        >
          <Select
            value={data.type}
            onChange={(e) => updateField('type', e.target.value)}
            error={!!errors.type}
            disabled={isSubmitting}
            options={typeOptions}
            placeholder="Seleziona tipo"
          />
        </FormField>

        {/* Category field */}
        <FormField
          id="transaction-category"
          label="Categoria"
          error={errors.category}
          required
        >
          <Select
            value={data.category}
            onChange={(e) => updateField('category', e.target.value)}
            error={!!errors.category}
            disabled={isSubmitting}
            options={categoryOptions}
            placeholder="Seleziona categoria"
          />
        </FormField>

        {/* Account field */}
        <FormField
          id="transaction-account"
          label="Conto"
          error={errors.accountId}
          required
        >
          <Select
            value={data.accountId}
            onChange={(e) => updateField('accountId', e.target.value)}
            error={!!errors.accountId}
            disabled={isSubmitting}
            options={accountOptions}
            placeholder="Seleziona conto"
          />
        </FormField>

        {/* To Account field - shown only for transfers */}
        {showToAccount && (
          <FormField
            id="transaction-to-account"
            label="Conto Destinazione"
            error={errors.toAccountId}
            required
          >
            <Select
              value={data.toAccountId}
              onChange={(e) => updateField('toAccountId', e.target.value)}
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
          onSubmit={handleFormSubmit}
          submitText="Salva Modifiche"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

EditTransactionModal.displayName = 'EditTransactionModal';
