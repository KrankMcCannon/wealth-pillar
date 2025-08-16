import { memo } from 'react';
import { Budget } from '../../types';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';
import { useEditBudget } from '../../hooks/features/settings/useEditBudget';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
}

/**
 * Componente presentazionale per editing budget
 */
export const EditBudgetModal = memo<EditBudgetModalProps>(({ isOpen, onClose, budget }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    categoryOptions,
    budgetStartDayOptions,
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleBudgetStartDayChange,
    handleCategoryToggle,
  } = useEditBudget({ budget, onClose });

  if (!budget) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Budget"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description field */}
        <FormField
          id="description"
          label="Descrizione"
          error={errors.description}
          required
        >
          <Input
            value={data.description}
            onChange={handleDescriptionChange}
            placeholder="Inserisci la descrizione del budget"
            error={!!errors.description}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Amount field */}
        <FormField
          id="amount"
          label="Importo Limite (€)"
          error={errors.amount}
          required
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            error={!!errors.amount}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Budget start day field */}
        <FormField
          id="budgetStartDay"
          label="Giorno di Inizio Budget"
          error={errors.budgetStartDay}
          required
        >
          <Select
            value={data.budgetStartDay}
            onChange={handleBudgetStartDayChange}
            error={!!errors.budgetStartDay}
            disabled={isSubmitting}
            options={budgetStartDayOptions}
            placeholder="Seleziona giorno"
          />
        </FormField>

        {/* Categories field */}
        <FormField
          id="categories"
          label="Categorie"
          error={errors.selectedCategories}
          required
        >
          <CheckboxGroup
            options={categoryOptions}
            onChange={handleCategoryToggle}
          />
        </FormField>

        {/* Submit error */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

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

EditBudgetModal.displayName = 'EditBudgetModal';
