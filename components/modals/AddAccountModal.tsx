import React, { memo } from 'react';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';
import { useAddAccount } from '../../hooks/features/accounts/useAddAccount';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente presentazionale per aggiunta account
 * Tutta la logica è delegata al hook useAddAccount
 */
export const AddAccountModal = memo<AddAccountModalProps>(({ isOpen, onClose }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    accountTypeOptions,
    peopleOptions,
    handleSubmit,
    handleNameChange,
    handleTypeChange,
    handlePersonToggle,
  } = useAddAccount({ onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi nuovo conto"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={handleNameChange}
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
            onChange={handleTypeChange}
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
            onToggle={handlePersonToggle}
            disabled={isSubmitting}
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
          onSubmit={handleSubmit}
          submitLabel="Aggiungi Conto"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AddAccountModal.displayName = 'AddAccountModal';
