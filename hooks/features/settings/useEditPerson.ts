/**
 * Hook per gestire la logica di editing delle persone
 * Separazione della logica business dalla presentazione UI
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Person } from '../../../types';
import { useFinance } from '../../core/useFinance';
import { useModalForm } from '../../ui/useModalForm';

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
    validateRequired,
  } = modalForm;

  // Reset form data when person changes
  useEffect(() => {
    if (person) {
      resetForm();
    }
  }, [person, resetForm]);

  // Validation rules - Business Logic
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['name'])) {
      return false;
    }

    if (data.name.trim().length === 0) {
      setError('name', 'Il nome non può essere vuoto');
      return false;
    }

    if (data.name.trim().length < 2) {
      setError('name', 'Il nome deve contenere almeno 2 caratteri');
      return false;
    }

    return true;
  }, [data, validateRequired, setError, clearAllErrors]);

  // Submit handler - Business Logic
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

  // Field change handlers - Business Logic
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('avatar', e.target.value);
  }, [updateField]);

  const handleThemeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('themeColor', e.target.value);
  }, [updateField]);

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
    canSubmit: person !== null,
  };
};
