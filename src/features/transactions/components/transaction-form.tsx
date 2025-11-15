"use client";

import { Transaction, TransactionType } from "@/src/lib";
import {
  AccountField,
  AmountField,
  CategoryField,
  DateField,
  FormActions,
  FormField,
  FormSelect,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
  UserField,
} from "@/src/components/ui";

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: TransactionType;
  selectedUserId?: string;
  transaction?: Transaction; // For editing existing transactions
  mode?: "create" | "edit";
}

export function TransactionForm({ isOpen, onOpenChange, mode = "create" }: Readonly<TransactionFormProps>) {
  const title = mode === "edit" ? "Modifica transazione" : "Nuova transazione";
  const description = mode === "edit" ? "Aggiorna i dettagli della transazione" : "Aggiungi una nuova transazione";

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
    //   console.error('[TransactionForm] Submit error:', err);
    // }
  };

  return (
    <form className="space-y-4">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === "edit" ? "Aggiorna" : "Crea"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={false}
          />
        }
      >
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Utente */}
              <UserField value={""} onChange={() => {}} error={""} required />

              {/* Tipo */}
              <FormField label="Tipo" required error={""}>
                <FormSelect
                  value={""}
                  onValueChange={() => {}}
                  options={[
                    { value: "income", label: "Entrata" },
                    { value: "expense", label: "Uscita" },
                    { value: "transfer", label: "Trasferimento" },
                  ]}
                  placeholder="Seleziona tipo"
                />
              </FormField>

              {/* Conto origine */}
              <AccountField value={""} onChange={() => {}} error={""} userId={""} required />

              {/* Conto destinazione per trasferimenti */}
              {false && (
                <FormField label="Conto destinazione" required error={""}>
                  <FormSelect
                    value={""}
                    onValueChange={() => {}}
                    options={[]}
                    placeholder="Seleziona conto destinazione"
                    showEmpty
                  />
                </FormField>
              )}

              {/* Categoria */}
              <CategoryField value={""} onChange={() => {}} error={""} required />

              {/* Importo */}
              <AmountField value={""} onChange={() => {}} error={""} required />

              {/* Data */}
              <DateField value={""} onChange={() => {}} error={""} required />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={""}>
              <Input value={""} onChange={() => {}} placeholder="Es. Spesa supermercato" />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}
