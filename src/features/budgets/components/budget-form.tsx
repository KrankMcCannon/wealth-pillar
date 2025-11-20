"use client";

import { Budget, Category } from "@/src/lib";
import {
  FormActions,
  FormCheckboxGroup,
  FormField,
  FormSelect,
} from "@/src/components/form";
import {
  AmountField,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
  UserField,
} from "@/src/components/ui";
import { useMemo } from "react";

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  budget?: Budget; // For editing existing budgets
  mode?: "create" | "edit";
  categories?: Category[];
}

export function BudgetForm({ isOpen, onOpenChange, selectedUserId, mode = "create", categories = [] }: BudgetFormProps) {
  const title = mode === "edit" ? "Modifica Budget" : "Nuovo Budget";
  const description = mode === "edit" ? "Aggiorna i dettagli del budget" : "Crea un nuovo budget";

  // Convert categories to checkbox options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.label,
      color: category.color,
    }));
  }, [categories]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }
    // try {
    //   await controller.submit();
    //   // Close modal if submission succeeded (no actual errors, just undefined values)
    //   const hasActualErrors = Object.values(controller.errors).some(err => err !== undefined);
    //   if (!controller.isSubmitting && !hasActualErrors) {
    //     onOpenChange(false);
    //   }
    // } catch (err) {
    //   console.error('[BudgetForm] Submit error:', err);
    // }
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
            submitLabel={mode === "edit" ? "Salva" : "Crea Budget"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={false}
          />
        }
      >
        <ModalContent className="gap-2">
          <ModalSection className="gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Utente (if not forced) */}
              {!selectedUserId && <UserField value={""} onChange={() => {}} error={""} required />}

              {/* Tipo */}
              <FormField label="Tipo budget" required error={""}>
                <FormSelect
                  value={""}
                  onValueChange={() => {}}
                  options={[
                    { value: "monthly", label: "Mensile" },
                    { value: "annually", label: "Annuale" },
                  ]}
                />
              </FormField>

              {/* Importo */}
              <AmountField value={0} onChange={() => {}} error={""} required />
            </div>
          </ModalSection>

          <ModalSection className="gap-2">
            {/* Descrizione */}
            <FormField label="Descrizione" required error={""}>
              <Input value={""} onChange={() => {}} placeholder="es. Spese mensili" />
            </FormField>
          </ModalSection>

          <ModalSection className="gap-1 shrink-0">
            <FormField label="Seleziona categorie" required error={""} className="space-y-1">
              <FormCheckboxGroup
                value={[]}
                onChange={() => {}}
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
