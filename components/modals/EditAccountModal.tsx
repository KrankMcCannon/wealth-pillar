import { memo } from 'react';
import { Account } from '../../types';
import { BaseModal, FormField, Input, CheckboxGroup, ModalActions } from '../ui';
import { useAccountManagement } from '../../hooks';

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
    updateField,
    handleSubmit,
    handlePersonToggle,
  } = useAccountManagement(account);

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, onClose);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Conto"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Account name field */}
        <FormField
          id="name"
          label="Nome conto"
          error={errors.name}
          required
        >
          <Input
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
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
          onSubmit={handleFormSubmit}
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
