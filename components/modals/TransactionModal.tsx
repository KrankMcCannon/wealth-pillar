import { memo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { useTransactions } from '../../hooks';
import { useFinance } from '../../hooks/core/useFinance';
import { CategoryUtils } from '../../lib/utils/category.utils';

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditProps extends BaseProps {
  transaction: Transaction;
}

type TransactionModalProps = BaseProps | EditProps;

/**
 * Unified modal for Add/Edit Transaction
 * Decides add vs edit by presence of `transaction` prop.
 */
export const TransactionModal = memo<TransactionModalProps>((props) => {
  const isEdit = 'transaction' in props && !!props.transaction;
  const { useTransactionForm } = useTransactions();
  const { accounts, categories } = useFinance();

  const form = useTransactionForm(isEdit ? (props as EditProps).transaction : undefined);

  const { data, errors, isSubmitting, isValid, updateField, handleSubmit } = form;

  const typeOptions = [
    { value: TransactionType.ENTRATA, label: 'Entrata' },
    { value: TransactionType.SPESA, label: 'Spesa' },
  ];

  const categoryOptions = CategoryUtils.toSelectOptions(categories);
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const isTransfer = CategoryUtils.isCategoryTransfer(data.category);
  const transferAccountOptions = accounts
    .filter(a => a.id !== data.accountId)
    .map(a => ({ value: a.id, label: a.name }));

  const handleFormSubmit = async () => {
    await handleSubmit(props.onClose);
  };

  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    (updateField as any)(field as any, value);
  };

  return (
    <BaseModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={isEdit ? 'Modifica Transazione' : 'Aggiungi nuova transazione'}
      maxWidth="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Description */}
        <FormField label="Descrizione" id="description" error={errors.description} required>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Importo (€)" id="amount" error={errors.amount} required>
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

          <FormField label="Data" id="date" error={errors.date} required>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tipo" id="type" error={errors.type} required>
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

          <FormField label="Categoria" id="category" error={errors.category} required>
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
          label={!isEdit && isTransfer ? 'Account di origine' : 'Account'}
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

        {/* Actions */}
        <ModalActions
          onCancel={props.onClose}
          onSubmit={handleFormSubmit}
          submitText={isEdit ? 'Salva Modifiche' : 'Aggiungi Transazione'}
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!isValid}
        />
      </form>
    </BaseModal>
  );
});

TransactionModal.displayName = 'TransactionModal';

// Backwards compatible named exports
export { TransactionModal as AddTransactionModal, TransactionModal as EditTransactionModal };
