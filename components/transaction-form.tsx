"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormField } from "@/components/ui/form-field";
import { FormSelect, sortSelectOptions, toSelectOptions } from "@/components/ui/form-select";
import { FormDatePicker } from "@/components/ui/form-date-picker";
import { FormCurrencyInput } from "@/components/ui/form-currency-input";
import { FormActions } from "@/components/ui/form-actions";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { useCategories, useAccounts, useUsers } from "@/hooks";
import type { TransactionType, Transaction } from "@/lib/types";
import useTransactionFormController from "@/hooks/controllers/useTransactionFormController";

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
}: TransactionFormProps) {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: users = [] } = useUsers();

  const controller = useTransactionFormController({
    mode,
    initialType,
    selectedUserId,
    initialTransaction: transaction || null,
  });

  const sortedCategories = useMemo(
    () => sortSelectOptions(toSelectOptions(categories, (c) => c.key, (c) => c.label)),
    [categories]
  );

  const sortedUsers = useMemo(
    () => sortSelectOptions(toSelectOptions(users, (u) => u.id, (u) => u.name)),
    [users]
  );

  // Filter accounts based on selected user
  const filteredAccounts = useMemo(() => {
    // If no user selected or "all" users, return all accounts
    if (!controller.form.user_id || controller.form.user_id === "all") {
      return accounts;
    }
    // Filter to only show accounts that the selected user has access to
    // Accounts can have multiple users (user_ids is an array)
    return accounts.filter(account => account.user_ids?.includes(controller.form.user_id));
  }, [accounts, controller.form.user_id]);

  const sortedAccounts = useMemo(
    () => sortSelectOptions(toSelectOptions(filteredAccounts, (a) => a.id, (a) => a.name)),
    [filteredAccounts]
  );

  const title = mode === "edit" ? "Modifica transazione" : "Nuova transazione";
  const description = mode === "edit" ? "Aggiorna i dettagli della transazione" : "Aggiungi una nuova transazione";

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
          submitLabel={mode === "edit" ? "Aggiorna" : "Crea"}
          onCancel={() => onOpenChange(false)}
          isSubmitting={controller.isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalContent>
          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Utente */}
              <FormField label="Utente" required error={controller.errors.user_id}>
                <FormSelect
                  value={controller.form.user_id}
                  onValueChange={(v) => controller.setField("user_id", v)}
                  options={sortedUsers}
                  placeholder="Seleziona utente"
                  showEmpty
                />
              </FormField>

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
              <FormField label="Conto" required error={controller.errors.account_id}>
                <FormSelect
                  value={controller.form.account_id}
                  onValueChange={(v) => controller.setField("account_id", v)}
                  options={sortedAccounts}
                  placeholder="Seleziona conto"
                  showEmpty
                />
              </FormField>

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

              {/* Categoria (non per trasferimenti) */}
              {controller.form.type !== "transfer" && (
                <FormField label="Categoria" required error={controller.errors.category}>
                  <FormSelect
                    value={controller.form.category}
                    onValueChange={(v) => controller.setField("category", v)}
                    options={sortedCategories}
                    placeholder="Seleziona categoria"
                    showEmpty
                    renderIcon={(opt) => (
                      <CategoryIcon categoryKey={opt.value} size={iconSizes.sm} />
                    )}
                  />
                </FormField>
              )}

              {/* Importo */}
              <FormField label="Importo" required error={controller.errors.amount}>
                <FormCurrencyInput
                  value={controller.form.amount}
                  onChange={(v) => controller.setField("amount", v)}
                  placeholder="0.00"
                />
              </FormField>

              {/* Data */}
              <FormField label="Data" required error={controller.errors.date}>
                <FormDatePicker
                  value={controller.form.date}
                  onChange={(v) => controller.setField("date", v)}
                  placeholder="Seleziona data"
                />
              </FormField>
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
      </form>
    </ModalWrapper>
  );
}

