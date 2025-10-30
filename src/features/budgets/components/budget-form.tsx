"use client";

import { Budget, useCategories } from '@/src/lib';
import { useEffect, useMemo } from "react";
import useBudgetFormController from "../hooks/use-budget-form-controller";
import { AmountField, FormActions, FormCheckboxGroup, FormField, FormSelect, Input, ModalContent, ModalSection, ModalWrapper, sortCheckboxOptions, toCheckboxOptions, UserField } from '@/src/components/ui';

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  budget?: Budget; // For editing existing budgets
  mode?: 'create' | 'edit';
}

export function BudgetForm({
  isOpen,
  onOpenChange,
  selectedUserId,
  budget,
  mode = 'create'
}: BudgetFormProps) {
  const { data: categories = [] } = useCategories();
  const controller = useBudgetFormController({ mode, selectedUserId, initialBudget: budget || null });

  const categoryOptions = useMemo(
    () => sortCheckboxOptions(toCheckboxOptions(categories, (c) => c.key, (c) => c.label)),
    [categories]
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      controller.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = mode === 'edit' ? 'Modifica Budget' : 'Nuovo Budget';
  const description = mode === 'edit' ? 'Aggiorna i dettagli del budget' : 'Crea un nuovo budget';

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }
    try {
      await controller.submit();
      // Close modal if submission succeeded (no actual errors, just undefined values)
      const hasActualErrors = Object.values(controller.errors).some(err => err !== undefined);
      if (!controller.isSubmitting && !hasActualErrors) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error('[BudgetForm] Submit error:', err);
    }
  };

  return (
    <form className="space-y-2">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === 'edit' ? 'Salva' : 'Crea Budget'}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={controller.isSubmitting}
          />
        }
      >
        <ModalContent className="gap-2">
          <ModalSection className="gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Utente (if not forced) */}
              {!selectedUserId && (
                <UserField
                  value={controller.form.user_id}
                  onChange={(v) => controller.setField('user_id', v)}
                  error={controller.errors.user_id}
                  required
                />
              )}

              {/* Tipo */}
              <FormField label="Tipo budget" required error={controller.errors.type}>
                <FormSelect
                  value={controller.form.type}
                  onValueChange={(v) => controller.setField('type', v as any)}
                  options={[{ value: 'monthly', label: 'Mensile' }, { value: 'annually', label: 'Annuale' }]}
                />
              </FormField>

              {/* Importo */}
              <AmountField
                value={controller.form.amount}
                onChange={(v) => controller.setField('amount', v)}
                error={controller.errors.amount}
                required
              />
            </div>
          </ModalSection>

          <ModalSection className="gap-2">
            {/* Descrizione */}
            <FormField label="Descrizione" required error={controller.errors.description}>
              <Input
                value={controller.form.description}
                onChange={(e) => controller.setField('description', e.target.value)}
                placeholder="es. Spese mensili"
              />
            </FormField>
          </ModalSection>

          <ModalSection className="gap-1 shrink-0">
            <FormField label="Seleziona categorie" required error={controller.errors.categories as any} className="space-y-1">
              <FormCheckboxGroup
                value={controller.form.categories}
                onChange={(vals) => controller.setField('categories', vals)}
                options={categoryOptions}
                showSearch
                showSelectAll
                maxHeight="200px"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}
