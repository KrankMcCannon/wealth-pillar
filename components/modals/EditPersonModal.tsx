import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance, useModalForm } from '../../hooks';
import { Person } from '../../types';
import { BaseModal, FormField, Input, ModalActions } from '../ui';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

interface EditPersonFormData {
  name: string;
  avatar: string;
  themeColor: string;
}

export const EditPersonModal = memo<EditPersonModalProps>(({ isOpen, onClose, person }) => {
  const { updatePerson } = useFinance();

  // Initial form data from person
  const initialFormData: EditPersonFormData = useMemo(() => ({
    name: person?.name || '',
    avatar: person?.avatar || '',
    themeColor: person?.themeColor || '#3b82f6',
  }), [person]);

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

  // Reset form data when person changes
  useEffect(() => {
    if (person) {
      resetForm();
    }
  }, [person, resetForm]);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['name'])) {
      return false;
    }

    if (data.name.trim().length === 0) {
      setError('name', 'Il nome non può essere vuoto');
      return false;
    }

    return true;
  }, [data, validateRequired, setError, clearAllErrors]);

  // Submit handler
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
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiornamento della persona');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, person, updatePerson, onClose, setError]);

  // Field change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('avatar', e.target.value);
  }, [updateField]);

  const handleThemeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('themeColor', e.target.value);
  }, [updateField]);

  const submitError = errors.submit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Profilo"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <FormField
          label="Nome completo"
          error={errors.name}
          required
        >
          <Input
            value={data.name}
            onChange={handleNameChange}
            placeholder="Inserisci il nome completo"
            error={!!errors.name}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Avatar field */}
        <FormField
          label="URL Avatar"
          error={errors.avatar}
        >
          <Input
            type="url"
            value={data.avatar}
            onChange={handleAvatarChange}
            placeholder="https://esempio.com/avatar.jpg"
            error={!!errors.avatar}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Theme color field */}
        <FormField
          label="Colore Tema"
          error={errors.themeColor}
        >
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={data.themeColor}
              onChange={handleThemeColorChange}
              className="p-1 h-10 w-14 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-lg disabled:opacity-50"
              disabled={isSubmitting}
            />
            <Input
              type="text"
              value={data.themeColor}
              onChange={handleThemeColorChange}
              placeholder="#3b82f6"
              error={!!errors.themeColor}
              disabled={isSubmitting}
              className="flex-1"
            />
          </div>
        </FormField>

        {/* Submit error */}
        {submitError && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Salva Modifiche"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

EditPersonModal.displayName = 'EditPersonModal';