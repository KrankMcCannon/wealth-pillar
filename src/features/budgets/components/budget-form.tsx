"use client";

import { Budget } from "@/src/lib";
import {
  AmountField,
  FormActions,
  FormCheckboxGroup,
  FormField,
  FormSelect,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
  UserField,
} from "@/src/components/ui";

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  budget?: Budget; // For editing existing budgets
  mode?: "create" | "edit";
}

export function BudgetForm({ isOpen, onOpenChange, selectedUserId, mode = "create" }: BudgetFormProps) {
  const title = mode === "edit" ? "Modifica Budget" : "Nuovo Budget";
  const description = mode === "edit" ? "Aggiorna i dettagli del budget" : "Crea un nuovo budget";

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
                options={[]}
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
