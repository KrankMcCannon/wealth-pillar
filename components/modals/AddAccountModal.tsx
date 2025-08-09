import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { useModalForm } from '../../hooks/useModalForm';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountFormData {
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'investment';
  selectedPersonIds: string[];
}

export const AddAccountModal = memo<AddAccountModalProps>(({ isOpen, onClose }) => {
  const { addAccount, people } = useFinance();

  const initialFormData: AccountFormData = useMemo(() => ({
    name: '',
    type: 'checking',
    selectedPersonIds: [],
  }), []);

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
    resetOnClose: true,
    resetOnOpen: true,
  });

  // Account type options
  const accountTypeOptions = useMemo(() => [
    { value: 'stipendio', label: 'Stipendio' },
    { value: 'risparmi', label: 'Risparmi' },
    { value: 'contanti', label: 'Contanti' },
    { value: 'investimenti', label: 'Investimenti' },
  ], []);

  // People checkbox options
  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: data.selectedPersonIds.includes(person.id),
    }))
  , [people, data.selectedPersonIds]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Validation
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
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await addAccount({
        name: data.name.trim(),
        type: data.type,
        personIds: data.selectedPersonIds,
        balance: 0, // Default balance
      });
      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiunta del conto');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, addAccount, onClose, setError]);

  // Field change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField('type', e.target.value);
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
      title="Aggiungi nuovo conto"
      error={submitError}
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

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="Aggiungi Conto"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

AddAccountModal.displayName = 'AddAccountModal';
