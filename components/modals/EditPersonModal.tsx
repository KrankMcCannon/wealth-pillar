import { memo } from "react";
import { Person } from "../../types";
import { BaseModal, FormField, Input, ModalActions, AvatarSelector } from "../ui";
import { usePersonManagement } from "../../hooks";
import { useFinance } from "../../hooks/core/useFinance";

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

/**
 * Componente presentazionale per editing persone
 */
export const EditPersonModal = memo<EditPersonModalProps>(({ isOpen, onClose, person }) => {
  const { people } = useFinance();
  const { data, errors, isSubmitting, canSubmit, updateField, handleSubmit } = usePersonManagement(person);

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, onClose);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Modifica Profilo">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Name field */}
        <FormField id="name" label="Nome completo" error={errors.name} required>
          <Input
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Inserisci il nome completo"
            error={!!errors.name}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Avatar field */}
        <AvatarSelector
          people={people}
          selectedAvatarId={data.avatar}
          onAvatarSelect={(avatarId) => {
            updateField('avatar', avatarId);
          }}
          currentPersonId={person?.id}
          disabled={isSubmitting}
        />

        {/* Theme color field removed for simplified management */}

        {/* Submit error */}
        {errors.general && <div className="text-red-600 text-sm">{errors.general}</div>}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleFormSubmit}
          submitText="Salva Modifiche"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});
EditPersonModal.displayName = "EditPersonModal";
