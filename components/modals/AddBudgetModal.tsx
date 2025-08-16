import { memo } from 'react';
import { BaseModal, FormField, Input, CheckboxGroup, ModalActions } from '../ui';
import { useAddBudget } from '../../hooks/features/budgets/useAddBudget';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
}

/**
 * Componente presentazionale per aggiunta budget
 */
export const AddBudgetModal = memo<AddBudgetModalProps>(({ isOpen, onClose, personId }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    categoryOptions,
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleCategoryToggle,
  } = useAddBudget({ personId, onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi Nuovo Budget"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <FormField
          label="Descrizione"
          id="budget-description"
          error={errors.description}
          required
        >
          <Input
            type="text"
            id="budget-description"
            value={data.description}
            onChange={handleDescriptionChange}
            error={!!errors.description}
            disabled={isSubmitting}
            placeholder="es: Spese Essenziali, Intrattenimento, Cura Personale"
          />
        </FormField>

        {/* Amount */}
        <FormField
          label="Importo Mensile (€)"
          id="budget-amount"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            id="budget-amount"
            value={data.amount}
            onChange={handleAmountChange}
            error={!!errors.amount}
            disabled={isSubmitting}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </FormField>

        {/* Categories */}
        <FormField
          label="Categorie Associate"
          id="categories-selection"
          error={errors.selectedCategories}
          required
        >
          <CheckboxGroup
            options={categoryOptions}
            onChange={handleCategoryToggle}
            columns={2}
            maxHeight="16rem"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Selezionate: {data.selectedCategories.length} categorie
          </p>
        </FormField>

        {/* Submit error */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="Aggiungi Budget"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AddBudgetModal.displayName = 'AddBudgetModal';
