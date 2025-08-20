import { memo, useEffect } from 'react';
import { Budget } from '../../types';
import { BaseModal, FormField, Input, Select, CheckboxGroup, ModalActions } from '../ui';
import { useBudgets } from '../../hooks';
import { useFinance } from '../../hooks/core/useFinance';
import { CategoryUtils } from '../../lib/utils/category.utils';

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddProps extends BaseProps {
  personId?: string;
}

interface EditProps extends BaseProps {
  budget: Budget | null;
}

type BudgetModalProps = AddProps | EditProps;

/**
 * Unified modal for Add/Edit Budget
 * Uses useBudgets form logic for both flows.
 */
export const BudgetModal = memo<BudgetModalProps>((props) => {
  const isEdit = 'budget' in props && !!props.budget;

  const { budgetForm, peopleOptions, openBudgetForm, saveBudgetForm, handlePersonToggle } = useBudgets();
  const { categories } = useFinance();

  // Seed form on open depending on mode
  useEffect(() => {
    if (!props.isOpen) return;
    if (isEdit) {
      openBudgetForm((props as EditProps).budget || undefined);
    } else {
      openBudgetForm();
      const addProps = props as AddProps;
      if (addProps.personId) {
        budgetForm.updateField('selectedPersonIds', [addProps.personId]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen, isEdit]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBudgetForm(props.onClose);
  };

  const categoryOptions = CategoryUtils.toSelectOptions(categories);

  return (
    <BaseModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={isEdit ? 'Modifica Budget' : 'Aggiungi Nuovo Budget'}
      maxWidth="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Description */}
        <FormField label="Descrizione" id="budget-description" error={budgetForm.errors.description} required>
          <Input
            type="text"
            id="budget-description"
            value={budgetForm.data.name}
            onChange={(e) => budgetForm.updateField('name', e.target.value)}
            error={!!budgetForm.errors.description}
            disabled={budgetForm.isSubmitting}
            placeholder="es: Spese Essenziali"
          />
        </FormField>

        {/* Amount */}
        <FormField label="Importo Mensile (€)" id="budget-amount" error={budgetForm.errors.amount} required>
          <Input
            type="number"
            id="budget-amount"
            value={budgetForm.data.amount || ''}
            onChange={(e) => budgetForm.updateField('amount', Number(e.target.value))}
            error={!!budgetForm.errors.amount}
            disabled={budgetForm.isSubmitting}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </FormField>

        {/* Category (single select) */}
        <FormField label="Categoria" id="budget-category" error={budgetForm.errors.categories || budgetForm.errors.category} required>
          <Select
            id="budget-category"
            value={budgetForm.data.category}
            onChange={(e) => budgetForm.updateField('category', e.target.value)}
            options={categoryOptions}
            error={!!(budgetForm.errors.categories || budgetForm.errors.category)}
            disabled={budgetForm.isSubmitting}
            placeholder="Seleziona categoria"
          />
        </FormField>

        {/* Person (single selection with checkbox UI) */}
        <FormField label="Persona" id="budget-person" error={budgetForm.errors.selectedPersonIds} required>
          <CheckboxGroup
            options={peopleOptions}
            onChange={(personId, checked) => {
              // Enforce single selection
              const next = checked ? [personId] : [];
              budgetForm.updateField('selectedPersonIds', next);
              handlePersonToggle(personId, checked);
            }}
            columns={1}
          />
        </FormField>

        {/* Submit error */}
        {budgetForm.errors.general && (
          <div className="text-red-600 text-sm">{budgetForm.errors.general}</div>
        )}

        <ModalActions
          onCancel={props.onClose}
          onSubmit={handleFormSubmit}
          submitText={isEdit ? 'Salva Modifiche' : 'Aggiungi Budget'}
          cancelText="Annulla"
          isSubmitting={budgetForm.isSubmitting}
          submitDisabled={!budgetForm.isValid}
        />
      </form>
    </BaseModal>
  );
});

BudgetModal.displayName = 'BudgetModal';

// Backwards compatible named exports
export { BudgetModal as AddBudgetModal, BudgetModal as EditBudgetModal };

