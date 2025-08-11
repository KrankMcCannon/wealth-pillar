import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { Account } from '../../../types';

interface EditAccountFormData {
  name: string;
  selectedPersonIds: string[];
}

interface UseEditAccountProps {
  account: Account | null;
  onClose: () => void;
}

/**
 * Hook per gestire la logica di editing account
 * Estrae tutta la business logic dal componente UI
 */
export const useEditAccount = ({ account, onClose }: UseEditAccountProps) => {
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
      setError('general', err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del conto');
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

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return data.name.trim().length > 0 && 
           data.selectedPersonIds.length > 0;
  }, [data]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,
    
    // Computed values
    peopleOptions,
    
    // Event handlers
    handleSubmit,
    handleNameChange,
    handlePersonToggle,
  };
};
