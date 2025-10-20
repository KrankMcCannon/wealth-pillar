/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormField } from "@/components/ui/form-field";
import { FormSelect, sortSelectOptions, toSelectOptions } from "@/components/ui/form-select";
import { FormCurrencyInput } from "@/components/ui/form-currency-input";
import { FormCheckboxGroup, sortCheckboxOptions, toCheckboxOptions } from "@/components/ui/form-checkbox-group";
import { FormActions } from "@/components/ui/form-actions";
import { useCategories, useUsers } from "@/hooks";
import type { Budget } from "@/lib/types";
import useBudgetFormController from "@/hooks/controllers/useBudgetFormController";

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
  const { data: users = [] } = useUsers();
  const controller = useBudgetFormController({ mode, selectedUserId, initialBudget: budget || null });

  const sortedUsers = useMemo(
    () => sortSelectOptions(toSelectOptions(users, (u) => u.id, (u) => u.name)),
    [users]
  );
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Utente (if not forced) */}
              {!selectedUserId && (
                <FormField label="Utente" required error={controller.errors.user_id}>
                  <FormSelect
                    value={controller.form.user_id}
                    onValueChange={(v) => controller.setField('user_id', v)}
                    options={sortedUsers}
                    placeholder="Seleziona utente"
                    showEmpty
                  />
                </FormField>
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
              <FormField label="Importo" required error={controller.errors.amount}>
                <FormCurrencyInput
                  value={controller.form.amount}
                  onChange={(v) => controller.setField('amount', v)}
                  placeholder="0.00"
                />
              </FormField>
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={controller.errors.description}>
              <Input
                value={controller.form.description}
                onChange={(e) => controller.setField('description', e.target.value)}
                placeholder="es. Spese mensili"
              />
            </FormField>
          </ModalSection>

          <ModalSection title="Categorie">
            <FormField label="Seleziona categorie" required error={controller.errors.categories as any}>
              <FormCheckboxGroup
                value={controller.form.categories}
                onChange={(vals) => controller.setField('categories', vals)}
                options={categoryOptions}
                showSearch
                showSelectAll
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </form>
    </ModalWrapper>
  );
}
