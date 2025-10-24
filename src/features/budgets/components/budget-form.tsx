"use client";

import { Budget, useCategories } from '@/src/lib';
import { useMemo } from "react";
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

  const title = mode === 'edit' ? 'Modifica Budget' : 'Nuovo Budget';
  const description = mode === 'edit' ? 'Aggiorna i dettagli del budget' : 'Crea un nuovo budget';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await controller.submit();
    if (!controller.isSubmitting && Object.keys(controller.errors).length === 0) {
      onOpenChange(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth="md"
      footer={
        <FormActions
          submitType="submit"
          submitLabel={mode === 'edit' ? 'Salva' : 'Crea Budget'}
          onCancel={() => onOpenChange(false)}
          isSubmitting={controller.isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-2">
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

          <ModalSection className="gap-1 flex-shrink-0">
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
      </form>
    </ModalWrapper>
  );
}
