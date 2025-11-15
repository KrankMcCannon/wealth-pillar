"use client";

import { RecurringTransactionSeries } from "@/src/lib";
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

type Mode = "create" | "edit";

interface RecurringSeriesFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  series?: RecurringTransactionSeries;
  mode?: Mode;
}

export function RecurringSeriesForm({ isOpen, onOpenChange, mode = "create" }: RecurringSeriesFormProps) {
  const title = mode === "edit" ? "Modifica Serie Ricorrente" : "Nuova Serie Ricorrente";
  const description = mode === "edit" ? "Aggiorna la serie ricorrente" : "Configura una nuova serie ricorrente";

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
    //   console.error('[RecurringSeriesForm] Submit error:', err);
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
            submitLabel={mode === "edit" ? "Salva" : "Crea Serie"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={false}
          />
        }
      >
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo (limit to income/expense in UI) */}
              <FormField label="Tipo" required error={undefined}>
                <FormSelect
                  value={""}
                  onValueChange={() => {}}
                  options={[
                    { value: "expense", label: "Uscita" },
                    { value: "income", label: "Entrata" },
                  ]}
                />
              </FormField>

              {/* Utente */}
              <UserField value={""} onChange={() => {}} error={""} required />

              {/* Conto */}
              <AccountField value={""} onChange={() => {}} error={""} userId={""} required />

              {/* Categoria */}
              <CategoryField value={""} onChange={() => {}} error={""} required />

              {/* Frequenza */}
              <FormField label="Frequenza" required error={""}>
                <FormSelect
                  value={""}
                  onValueChange={() => {}}
                  options={[
                    { value: "weekly", label: "Settimanale" },
                    { value: "biweekly", label: "Quindicinale" },
                    { value: "monthly", label: "Mensile" },
                    { value: "yearly", label: "Annuale" },
                  ]}
                />
              </FormField>

              {/* Importo */}
              <AmountField value={""} onChange={() => {}} error={""} required />

              {/* Data addebito */}
              <DateField label="Data addebito" value={""} onChange={() => {}} error={""} required />

              {/* Data inizio */}
              <DateField label="Data inizio" value={""} onChange={() => {}} error={""} required />

              {/* Data fine (opzionale) */}
              <DateField label="Data fine" value={""} onChange={() => {}} error={""} />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={""}>
              <Input value={""} onChange={() => {}} placeholder="Es. Abbonamento Netflix" />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}
