import { memo } from "react";
import { Person } from "../../types";
import { BaseModal, FormField, Input, ModalActions } from "../ui";
import { useEditPerson } from "../../hooks/features/settings/useEditPerson";

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

/**
 * Componente presentazionale per editing persone
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
    handleHexColorChange,
    canSubmit,
    colorValidation,
  } = useEditPerson({ person, onClose });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Modifica Profilo">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <FormField id="name" label="Nome completo" error={errors.name} required>
          <Input
            value={data.name}
            onChange={handleNameChange}
            placeholder="Inserisci il nome completo"
            error={!!errors.name}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Avatar field */}
        <FormField id="avatar" label="URL Avatar" error={errors.avatar}>
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
        <FormField id="themeColor" label="Colore Tema" error={errors.themeColor}>
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              <input
                type="color"
                value={data.themeColor}
                onChange={handleThemeColorChange}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0 disabled:opacity-0"
                disabled={isSubmitting}
                aria-label="Seleziona colore tema"
              />
              <div
                className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full"
                style={{ backgroundColor: data.themeColor }}
              />
            </div>
            <div className="flex flex-1 max-w-24">
              <div className="flex items-center px-2 py-2 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500 dark:text-gray-400 font-mono text-xs">
                #
              </div>
              <input
                type="text"
                value={data.themeColor.replace("#", "")}
                onChange={(e) => {
                  handleHexColorChange(e.target.value);
                }}
                placeholder="3b82f6"
                className={`flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs ${
                  colorValidation.isValid && data.themeColor.replace("#", "").length === 6
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : !colorValidation.isValid && data.themeColor.replace("#", "").length > 0
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                disabled={isSubmitting}
                maxLength={6}
                aria-label="Inserisci codice colore esadecimale"
                title="Inserisci un codice colore esadecimale di 6 caratteri (es. 3b82f6)"
              />
            </div>
          </div>
          {!colorValidation.isValid && colorValidation.message && (
            <p className="text-sm text-red-500 mt-1">{colorValidation.message}</p>
          )}
        </FormField>

        {/* Submit error */}
        {errors.general && <div className="text-red-600 text-sm">{errors.general}</div>}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
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
