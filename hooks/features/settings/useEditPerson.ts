/**
 * Hook per gestire la logica di editing delle persone
 * Separazione della logica business dalla presentazione UI
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Person } from '../../../types';
import { useFinance } from '../../core/useFinance';
import { useModalForm } from '../../ui/useModalForm';
import { validatePersonForm } from '../../utils/validators';

interface EditPersonFormData {
  name: string;
  avatar: string;
  themeColor: string;
}

interface UseEditPersonProps {
  person: Person | null;
  onClose: () => void;
}

export const useEditPerson = ({ person, onClose }: UseEditPersonProps) => {
  const { updatePerson } = useFinance();

  // Initial form data from person
  const initialFormData: EditPersonFormData = useMemo(() => ({
    name: person?.name || '',
    avatar: person?.avatar || '',
    themeColor: person?.themeColor || '#3b82f6',
  }), [person]);

  const modalForm = useModalForm({
    initialData: initialFormData,
    resetOnClose: false,
    resetOnOpen: false,
  });

  const {
    data,
    errors,
    isSubmitting,
    updateField,
    setError,
    clearAllErrors,
    setSubmitting,
    resetForm,
  } = modalForm;

  useEffect(() => {
    if (person) {
      resetForm();
    }
  }, [person, resetForm]);

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = validatePersonForm({ name: data.name });
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data.name, clearAllErrors, setError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !person) {
      return;
    }

    setSubmitting(true);

    try {
      await updatePerson({
        ...person,
        name: data.name.trim(),
        avatar: data.avatar.trim(),
        themeColor: data.themeColor
      });
      onClose();
    } catch (error) {
      console.error('Failed to update person:', error);
      setError('general', 'Errore nel salvataggio. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }, [data, person, updatePerson, onClose, validateForm, setSubmitting, setError]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('avatar', e.target.value);
  }, [updateField]);

  const handleThemeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('themeColor', e.target.value);
  }, [updateField]);

  const canSubmit = useMemo(() => {
    return person !== null && Object.keys(validatePersonForm({ name: data.name })).length === 0;
  }, [data.name, person]);

  return {
    // Form data
    data,
    errors,
    isSubmitting,

    // Actions
    handleSubmit,
    handleNameChange,
    handleAvatarChange,
    handleThemeColorChange,

    // Validation
    canSubmit,
  };
};
