import { memo } from 'react';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';
import { useAccountManagement } from '../../hooks';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente presentazionale per aggiunta account
 */
export const AddAccountModal = memo<AddAccountModalProps>(({ isOpen, onClose }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    accountTypeOptions,
    peopleOptions,
    updateField,
    handleSubmit,
    handlePersonToggle,
  } = useAccountManagement();

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, onClose);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi nuovo conto"
      maxWidth="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Account Name */}
        <FormField
          label="Nome conto"
          id="account-name"
          error={errors.name}
          required
        >
          <Input
            type="text"
            id="account-name"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={!!errors.name}
            disabled={isSubmitting}
            placeholder="es: Conto Risparmio Condiviso"
          />
        </FormField>

        {/* Account Type */}
        <FormField
          label="Tipo conto"
          id="account-type"
          error={errors.type}
          required
        >
          <Select
            id="account-type"
            value={data.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={accountTypeOptions}
            error={!!errors.type}
            disabled={isSubmitting}
          />
        </FormField>

        {/* People Selection */}
        <FormField
          label="Persone associate"
          id="people-selection"
          error={errors.selectedPersonIds}
          required
        >
          <CheckboxGroup
            options={peopleOptions}
            onChange={handlePersonToggle}
            columns={1}
          />
          {data.selectedPersonIds.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selezionate: {data.selectedPersonIds.length} persone
            </p>
          )}
        </FormField>

        {/* Submit error */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleFormSubmit}
          submitText="Aggiungi Conto"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AddAccountModal.displayName = 'AddAccountModal';
