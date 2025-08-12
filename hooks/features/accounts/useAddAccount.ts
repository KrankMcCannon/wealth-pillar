import React, { useCallback, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';

interface AccountFormData {
  name: string;
  type: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
  selectedPersonIds: string[];
}

interface UseAddAccountProps {
  onClose: () => void;
}

/**
 * Hook per gestire la logica di aggiunta account
 * Estrae tutta la business logic dal componente UI
 */
export const useAddAccount = ({ onClose }: UseAddAccountProps) => {
  const { addAccount, people } = useFinance();

  const initialFormData: AccountFormData = useMemo(() => ({
    name: '',
    type: 'stipendio',
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
      setError('general', err instanceof Error ? err.message : 'Errore durante l\'aggiunta del conto');
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

  // Reset form when needed
  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

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
    accountTypeOptions,
    peopleOptions,
    
    // Event handlers
    handleSubmit,
    handleNameChange,
    handleTypeChange,
    handlePersonToggle,
    handleReset,
  };
};
