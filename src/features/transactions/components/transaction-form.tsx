"use client";

import { Transaction, TransactionType, useAccounts } from '@/src/lib';
import { useEffect, useMemo } from "react";
import useTransactionFormController from "../hooks/use-transaction-form-controller";
import { AccountField, AmountField, CategoryField, DateField, FormActions, FormField, FormSelect, Input, ModalContent, ModalSection, ModalWrapper, sortSelectOptions, toSelectOptions, UserField } from '@/src/components/ui';

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: TransactionType;
  selectedUserId?: string;
  transaction?: Transaction; // For editing existing transactions
  mode?: "create" | "edit";
}

export function TransactionForm({
  isOpen,
  onOpenChange,
  initialType = "expense",
  selectedUserId,
  transaction,
  mode = "create",
}: Readonly<TransactionFormProps>) {
  const { data: accounts = [] } = useAccounts();

  const controller = useTransactionFormController({
    mode,
    initialType,
    selectedUserId,
    initialTransaction: transaction || null,
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      controller.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter accounts based on selected user for destination account in transfers
  const filteredAccounts = useMemo(() => {
    if (!controller.form.user_id || controller.form.user_id === "all") {
      return accounts;
    }
    return accounts.filter(account => account.user_ids?.includes(controller.form.user_id));
  }, [accounts, controller.form.user_id]);

  const sortedAccounts = useMemo(
    () => sortSelectOptions(toSelectOptions(filteredAccounts, (a) => a.id, (a) => a.name)),
    [filteredAccounts]
  );

  const title = mode === "edit" ? "Modifica transazione" : "Nuova transazione";
  const description = mode === "edit" ? "Aggiorna i dettagli della transazione" : "Aggiungi una nuova transazione";

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
      console.error('[TransactionForm] Submit error:', err);
    }
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
            isSubmitting={controller.isSubmitting}
          />
        }
      >
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Utente */}
              <UserField
                value={controller.form.user_id}
                onChange={(v) => controller.setField("user_id", v)}
                error={controller.errors.user_id}
                required
              />

              {/* Tipo */}
              <FormField label="Tipo" required error={controller.errors.type}>
                <FormSelect
                  value={controller.form.type}
                  onValueChange={(v) => controller.setField("type", v as TransactionType)}
                  options={[
                    { value: "income", label: "Entrata" },
                    { value: "expense", label: "Uscita" },
                    { value: "transfer", label: "Trasferimento" },
                  ]}
                  placeholder="Seleziona tipo"
                />
              </FormField>

              {/* Conto origine */}
              <AccountField
                value={controller.form.account_id}
                onChange={(v) => controller.setField("account_id", v)}
                error={controller.errors.account_id}
                userId={controller.form.user_id}
                required
              />

              {/* Conto destinazione per trasferimenti */}
              {controller.form.type === "transfer" && (
                <FormField label="Conto destinazione" required error={controller.errors.to_account_id}>
                  <FormSelect
                    value={controller.form.to_account_id || ""}
                    onValueChange={(v) => controller.setField("to_account_id", v)}
                    options={sortedAccounts}
                    placeholder="Seleziona conto destinazione"
                    showEmpty
                  />
                </FormField>
              )}

              {/* Categoria */}
              <CategoryField
                value={controller.form.category}
                onChange={(v) => controller.setField("category", v)}
                error={controller.errors.category}
                required
              />

              {/* Importo */}
              <AmountField
                value={controller.form.amount}
                onChange={(v) => controller.setField("amount", v)}
                error={controller.errors.amount}
                required
              />

              {/* Data */}
              <DateField
                value={controller.form.date}
                onChange={(v) => controller.setField("date", v)}
                error={controller.errors.date}
                required
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={controller.errors.description}>
              <Input
                value={controller.form.description}
                onChange={(e) => controller.setField("description", e.target.value)}
                placeholder="Es. Spesa supermercato"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

