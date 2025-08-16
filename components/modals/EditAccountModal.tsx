import { memo } from 'react';
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
          id="name"
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
          id="people"
          label="Associa persone"
          error={errors.selectedPersonIds}
          required
        >
          <CheckboxGroup
            options={peopleOptions}
            onChange={handlePersonToggle}
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
          submitText="Aggiorna Conto"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

EditAccountModal.displayName = 'EditAccountModal';
