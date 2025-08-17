import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { Account } from '../../../types';
import { validateAccountForm } from '../../utils/validators';

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
  } = useModalForm({
    initialData: initialFormData,
    resetOnClose: false,
    resetOnOpen: false,
  });

  useEffect(() => {
    if (account) {
      resetForm();
    }
  }, [account, resetForm]);

  const peopleOptions = useMemo(() =>
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: data.selectedPersonIds.includes(person.id),
    }))
    , [people, data.selectedPersonIds]);

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = validateAccountForm({
      name: data.name,
      selectedPersonIds: data.selectedPersonIds,
    });
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError]);

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

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handlePersonToggle = useCallback((personId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...data.selectedPersonIds, personId]
      : data.selectedPersonIds.filter(id => id !== personId);

    updateField('selectedPersonIds', newSelectedIds);
  }, [data.selectedPersonIds, updateField]);

  const canSubmit = useMemo(() => {
    return account !== null && Object.keys(validateAccountForm({
      name: data.name,
      selectedPersonIds: data.selectedPersonIds,
    })).length === 0;
  }, [data, account]);

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
