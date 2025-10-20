"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormField } from "@/components/ui/form-field";
import { FormSelect, sortSelectOptions, toSelectOptions } from "@/components/ui/form-select";
import { FormDatePicker } from "@/components/ui/form-date-picker";
import { FormCurrencyInput } from "@/components/ui/form-currency-input";
import { FormActions } from "@/components/ui/form-actions";
import { useAccounts, useCategories, useUsers } from "@/hooks";
import type { RecurringTransactionSeries, TransactionType } from "@/lib/types";
import useRecurringSeriesFormController from "@/hooks/controllers/useRecurringSeriesFormController";

type Mode = 'create' | 'edit';

interface RecurringSeriesFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  series?: RecurringTransactionSeries;
  mode?: Mode;
}

export function RecurringSeriesForm({ isOpen, onOpenChange, selectedUserId, series, mode = 'create' }: RecurringSeriesFormProps) {
  const { data: categories = [] } = useCategories();
  const { data: users = [] } = useUsers();
  const { data: accounts = [] } = useAccounts();

  const controller = useRecurringSeriesFormController({ mode, selectedUserId, initialSeries: series || null });

  const sortedUsers = useMemo(
    () => sortSelectOptions(toSelectOptions(users, (u) => u.id, (u) => u.name)),
    [users]
  );
  const sortedCategories = useMemo(
    () => sortSelectOptions(toSelectOptions(categories, (c) => c.key, (c) => c.label)),
    [categories]
  );
  const userAccounts = useMemo(
    () => accounts.filter((a) => a.user_ids.includes(controller.form.user_id)).map((a) => ({ value: a.id, label: a.name })),
    [accounts, controller.form.user_id]
  );

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
              <FormField label="Utente" required error={controller.errors.user_id}>
                <FormSelect
                  value={controller.form.user_id}
                  onValueChange={(v) => controller.setField('user_id', v)}
                  options={sortedUsers}
                  placeholder="Seleziona utente"
                  showEmpty
                />
              </FormField>

              {/* Conto */}
              <FormField label="Conto" required error={controller.errors.account_id}>
                <FormSelect
                  value={controller.form.account_id}
                  onValueChange={(v) => controller.setField('account_id', v)}
                  options={userAccounts}
                  placeholder="Seleziona conto"
                  showEmpty
                />
              </FormField>

              {/* Categoria */}
              <FormField label="Categoria" required error={controller.errors.category}>
                <FormSelect
                  value={controller.form.category}
                  onValueChange={(v) => controller.setField('category', v)}
                  options={sortedCategories}
                  placeholder="Seleziona categoria"
                  showEmpty
                />
              </FormField>

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
              <FormField label="Importo" required error={controller.errors.amount}>
                <FormCurrencyInput
                  value={controller.form.amount}
                  onChange={(v) => controller.setField('amount', v)}
                  placeholder="0.00"
                />
              </FormField>

              {/* Data addebito */}
              <FormField label="Data addebito" required error={controller.errors.due_date}>
                <FormDatePicker
                  value={controller.form.due_date}
                  onChange={(v) => controller.setField('due_date', v)}
                />
              </FormField>

              {/* Data inizio */}
              <FormField label="Data inizio" required error={controller.errors.start_date}>
                <FormDatePicker
                  value={controller.form.start_date}
                  onChange={(v) => controller.setField('start_date', v)}
                />
              </FormField>

              {/* Data fine (opzionale) */}
              <FormField label="Data fine" error={(controller.errors as any).end_date}>
                <FormDatePicker
                  value={controller.form.end_date}
                  onChange={(v) => controller.setField('end_date', v)}
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
                placeholder="Es. Abbonamento Netflix"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </form>
    </ModalWrapper>
  );
}

