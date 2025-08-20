import { memo } from 'react';
import { Account } from '../../types';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';
import { useAccountManagement } from '../../hooks';

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditProps extends BaseProps {
  account: Account | null;
}

type AccountModalProps = BaseProps | EditProps;

/**
 * Unified modal for Add/Edit Account
 * Uses presence of `account` to toggle edit mode and fields.
 */
export const AccountModal = memo<AccountModalProps>((props) => {
  const isEdit = 'account' in props && !!props.account;

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
  } = useAccountManagement(isEdit ? (props as EditProps).account || undefined : undefined);

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, props.onClose);
  };

  return (
    <BaseModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={isEdit ? 'Modifica Conto' : 'Aggiungi nuovo conto'}
      maxWidth="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Account name */}
        <FormField label="Nome conto" id="account-name" error={errors.name} required>
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

        {/* Account type (only add) */}
        {!isEdit && (
          <FormField label="Tipo conto" id="account-type" error={errors.type} required>
            <Select
              id="account-type"
              value={data.type}
              onChange={(e) => updateField('type', e.target.value)}
              options={accountTypeOptions}
              error={!!errors.type}
              disabled={isSubmitting}
            />
          </FormField>
        )}

        {/* People Selection */}
        <FormField label="Persone associate" id="people-selection" error={errors.selectedPersonIds} required>
          <CheckboxGroup options={peopleOptions} onChange={handlePersonToggle} columns={1} />
          {data.selectedPersonIds?.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selezionate: {data.selectedPersonIds.length} persone
            </p>
          )}
        </FormField>

        {/* Submit error */}
        {errors.general && <div className="text-red-600 text-sm">{errors.general}</div>}

        {/* Actions */}
        <ModalActions
          onCancel={props.onClose}
          onSubmit={handleFormSubmit}
          submitText={isEdit ? 'Aggiorna Conto' : 'Aggiungi Conto'}
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AccountModal.displayName = 'AccountModal';

// Backwards compatible named exports
export { AccountModal as AddAccountModal, AccountModal as EditAccountModal };

