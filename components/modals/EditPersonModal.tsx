import React, { memo } from 'react';
import { Person } from '../../types';
import { BaseModal, FormField, Input, ModalActions } from '../ui';
import { useEditPerson } from '../../hooks/features/settings/useEditPerson';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

/**
 * Componente presentazionale per editing persone
 * Tutta la logica è delegata al hook useEditPerson
 */
export const EditPersonModal = memo<EditPersonModalProps>(({ isOpen, onClose, person }) => {
  const {
    data,
    errors,
    isSubmitting,
    handleSubmit,
    handleNameChange,
    handleAvatarChange,
    handleThemeColorChange,
    canSubmit
  } = useEditPerson({ person, onClose });

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
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Salva Modifiche"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});
EditPersonModal.displayName = 'EditPersonModal';