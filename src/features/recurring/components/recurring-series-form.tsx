"use client";

import { RecurringTransactionSeries, TransactionType } from "@/lib";
import useRecurringSeriesFormController from "../hooks/use-recurring-series-form-controller";
import { AccountField, AmountField, CategoryField, DateField, FormActions, FormField, FormSelect, Input, ModalContent, ModalSection, ModalWrapper, UserField } from "@/components/ui";

type Mode = 'create' | 'edit';

interface RecurringSeriesFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  series?: RecurringTransactionSeries;
  mode?: Mode;
}

export function RecurringSeriesForm({ isOpen, onOpenChange, selectedUserId, series, mode = 'create' }: RecurringSeriesFormProps) {
  const controller = useRecurringSeriesFormController({ mode, selectedUserId, initialSeries: series || null });

  const title = mode === 'edit' ? 'Modifica Serie Ricorrente' : 'Nuova Serie Ricorrente';
  const description = mode === 'edit' ? 'Aggiorna la serie ricorrente' : 'Configura una nuova serie ricorrente';

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
          submitLabel={mode === 'edit' ? 'Salva' : 'Crea Serie'}
          onCancel={() => onOpenChange(false)}
          isSubmitting={controller.isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo (limit to income/expense in UI) */}
              <FormField label="Tipo" required error={controller.errors.type}>
                <FormSelect
                  value={controller.form.type}
                  onValueChange={(v) => controller.setField('type', v as TransactionType)}
                  options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }]}
                />
              </FormField>

              {/* Utente */}
              <UserField
                value={controller.form.user_id}
                onChange={(v) => controller.setField('user_id', v)}
                error={controller.errors.user_id}
                required
              />

              {/* Conto */}
              <AccountField
                value={controller.form.account_id}
                onChange={(v) => controller.setField('account_id', v)}
                error={controller.errors.account_id}
                userId={controller.form.user_id}
                required
              />

              {/* Categoria */}
              <CategoryField
                value={controller.form.category}
                onChange={(v) => controller.setField('category', v)}
                error={controller.errors.category}
                required
              />

              {/* Frequenza */}
              <FormField label="Frequenza" required error={controller.errors.frequency}>
                <FormSelect
                  value={controller.form.frequency}
                  onValueChange={(v) => controller.setField('frequency', v as any)}
                  options={[
                    { value: 'weekly', label: 'Settimanale' },
                    { value: 'biweekly', label: 'Quindicinale' },
                    { value: 'monthly', label: 'Mensile' },
                    { value: 'yearly', label: 'Annuale' },
                  ]}
                />
              </FormField>

              {/* Importo */}
              <AmountField
                value={controller.form.amount}
                onChange={(v) => controller.setField('amount', v)}
                error={controller.errors.amount}
                required
              />

              {/* Data addebito */}
              <DateField
                label="Data addebito"
                value={controller.form.due_date}
                onChange={(v) => controller.setField('due_date', v)}
                error={controller.errors.due_date}
                required
              />

              {/* Data inizio */}
              <DateField
                label="Data inizio"
                value={controller.form.start_date}
                onChange={(v) => controller.setField('start_date', v)}
                error={controller.errors.start_date}
                required
              />

              {/* Data fine (opzionale) */}
              <DateField
                label="Data fine"
                value={controller.form.end_date}
                onChange={(v) => controller.setField('end_date', v)}
                error={(controller.errors as any).end_date}
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={controller.errors.description}>
              <Input
                value={controller.form.description}
                onChange={(e) => controller.setField('description', e.target.value)}
                placeholder="Es. Abbonamento Netflix"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </form>
    </ModalWrapper>
  );
}

