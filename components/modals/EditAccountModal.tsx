import React, { memo } from 'react';
import { Account } from '../../types';
import { BaseModal, FormField, Input, CheckboxGroup, ModalActions } from '../ui';
import { useEditAccount } from '../../hooks/features/accounts/useEditAccount';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

/**
 * Componente presentazionale per editing account
 * Tutta la logica è delegata al hook useEditAccount
 */
export const EditAccountModal = memo<EditAccountModalProps>(({ isOpen, onClose, account }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    peopleOptions,
    handleSubmit,
    handleNameChange,
    handlePersonToggle,
  } = useEditAccount({ account, onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Conto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account name field */}
        <FormField
          label="Nome conto"
          error={errors.name}
          required
        >
          <Input
            value={data.name}
            onChange={handleNameChange}
            placeholder="Inserisci il nome del conto"
            error={!!errors.name}
            disabled={isSubmitting}
          />
        </FormField>

        {/* People selection */}
        <FormField
          label="Associa persone"
          error={errors.selectedPersonIds}
          required
        >
          <CheckboxGroup
            options={peopleOptions}
            onToggle={handlePersonToggle}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Submit error */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Aggiorna Conto"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

EditAccountModal.displayName = 'EditAccountModal';
