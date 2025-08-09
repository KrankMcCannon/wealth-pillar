import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { useModalForm } from '../../hooks/useModalForm';
import { Account } from '../../types';
import { BaseModal, FormField, Input, CheckboxGroup, ModalActions } from '../ui';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

interface EditAccountFormData {
  name: string;
  selectedPersonIds: string[];
}

export const EditAccountModal = memo<EditAccountModalProps>(({ isOpen, onClose, account }) => {
  const { updateAccount, people } = useFinance();

  // Initial form data from account
  const initialFormData: EditAccountFormData = useMemo(() => ({
    name: account?.name || '',
    selectedPersonIds: account?.personIds || [],
  }), [account]);

  const {
    data,
    errors,
    isSubmitting,
    updateField,
    setError,
    clearAllErrors,
    setSubmitting,
    resetForm,
    validateRequired,
  } = useModalForm({
    initialData: initialFormData,
    resetOnClose: false, // We handle reset manually for edit modals
    resetOnOpen: false,
  });

  // Reset form data when account changes
  useEffect(() => {
    if (account) {
      resetForm();
    }
  }, [account, resetForm]);

  // People checkbox options
  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: data.selectedPersonIds.includes(person.id),
    }))
  , [people, data.selectedPersonIds]);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['name'])) {
      return false;
    }

    if (data.name.trim().length === 0) {
      setError('name', 'Il nome del conto non può essere vuoto');
      return false;
    }

    if (data.selectedPersonIds.length === 0) {
      setError('selectedPersonIds', 'Seleziona almeno una persona per questo conto');
      return false;
    }

    return true;
  }, [data, validateRequired, setError, clearAllErrors]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !account) {
      return;
    }

    setSubmitting(true);

    try {
      await updateAccount({ 
        ...account, 
        name: data.name.trim(), 
        personIds: data.selectedPersonIds 
      });
      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del conto');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, account, updateAccount, onClose, setError]);

  // Field change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handlePersonToggle = useCallback((personId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...data.selectedPersonIds, personId]
      : data.selectedPersonIds.filter(id => id !== personId);
    
    updateField('selectedPersonIds', newSelectedIds);
  }, [data.selectedPersonIds, updateField]);

  const submitError = errors.submit;

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
        {submitError && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Aggiorna Conto"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

EditAccountModal.displayName = 'EditAccountModal';
