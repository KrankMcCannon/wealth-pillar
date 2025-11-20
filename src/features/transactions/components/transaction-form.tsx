"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, TransactionType, User, Account, Category } from "@/lib/types";
import { CreateTransactionInput } from "@/lib/services/transaction.service";
import { createTransactionAction, updateTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { transactionStyles } from "@/features/transactions/theme/transaction-styles";
import { ModalContent, ModalSection, ModalWrapper } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/src/components/form";
import { UserField, AccountField, CategoryField, AmountField, DateField } from "@/src/components/ui/fields";
import { Input } from "@/src/components/ui/input";

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  mode: "create" | "edit";
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  categories: Category[];
  groupId: string;
  selectedUserId?: string; // Pre-selected user from page filter
  onSuccess?: (transaction: Transaction, action: "create" | "update") => void;
}

interface FormData {
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  user_id: string | null;
  account_id: string;
  to_account_id: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  type?: string;
  category?: string;
  date?: string;
  user_id?: string;
  account_id?: string;
  to_account_id?: string;
  submit?: string;
}

export function TransactionForm({
  isOpen,
  onOpenChange,
  transaction,
  mode,
  currentUser,
  groupUsers,
  accounts,
  categories,
  groupId,
  selectedUserId,
  onSuccess,
}: Readonly<TransactionFormProps>) {
  const title = mode === "edit" ? "Modifica transazione" : "Nuova transazione";
  const description = mode === "edit" ? "Aggiorna i dettagli della transazione" : "Aggiungi una nuova transazione";

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split("T")[0],
    user_id: currentUser.id,
    account_id: "",
    to_account_id: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter accounts by selected user
  const filteredAccounts = useMemo(() => {
    if (!formData.user_id) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(formData.user_id!));
  }, [accounts, formData.user_id]);

  // Get default account for selected user
  const getDefaultAccountId = useCallback(
    (userId: string | null): string => {
      if (!userId) return accounts.length > 0 ? accounts[0].id : "";

      // Find user and use their default account
      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        // Verify the default account is accessible to this user
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
        );
        if (defaultAccount) return defaultAccount.id;
      }

      // Fall back to first account accessible to this user
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      return userAccounts.length > 0 ? userAccounts[0].id : accounts.length > 0 ? accounts[0].id : "";
    },
    [accounts, groupUsers]
  );

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && transaction) {
        // Populate form with existing transaction data
        setFormData({
          description: transaction.description,
          amount: transaction.amount.toString(),
          type: transaction.type,
          category: transaction.category,
          date:
            typeof transaction.date === "string"
              ? transaction.date.split("T")[0]
              : new Date(transaction.date).toISOString().split("T")[0],
          user_id: transaction.user_id || currentUser.id,
          account_id: transaction.account_id,
          to_account_id: transaction.to_account_id || "",
        });
      } else {
        // Reset to defaults for create mode
        // Use selectedUserId if provided, otherwise use currentUser.id
        const defaultUserId = selectedUserId || currentUser.id;
        setFormData({
          description: "",
          amount: "",
          type: "expense",
          category: "",
          date: new Date().toISOString().split("T")[0],
          user_id: defaultUserId,
          account_id: getDefaultAccountId(defaultUserId),
          to_account_id: "",
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, transaction, currentUser.id, selectedUserId, accounts, groupUsers, getDefaultAccountId]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria";
    } else if (formData.description.trim().length < 2) {
      newErrors.description = "La descrizione deve contenere almeno 2 caratteri";
    }

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = "L'importo è obbligatorio";
    } else if (amount <= 0) {
      newErrors.amount = "L'importo deve essere maggiore di zero";
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = "Il tipo è obbligatorio";
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = "La categoria è obbligatoria";
    }

    // Account validation
    if (!formData.account_id) {
      newErrors.account_id = "Il conto è obbligatorio";
    }

    // Transfer-specific validation
    if (formData.type === "transfer") {
      if (!formData.to_account_id) {
        newErrors.to_account_id = "Il conto di destinazione è obbligatorio per i trasferimenti";
      } else if (formData.to_account_id === formData.account_id) {
        newErrors.to_account_id = "Il conto di origine e destinazione devono essere diversi";
      }
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "La data è obbligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const amount = parseFloat(formData.amount);

      if (mode === "create") {
        // Create new transaction
        const input: CreateTransactionInput = {
          description: formData.description.trim(),
          amount,
          type: formData.type,
          category: formData.category,
          date: formData.date,
          user_id: formData.user_id,
          account_id: formData.account_id,
          to_account_id: formData.type === "transfer" ? formData.to_account_id : null,
          group_id: groupId,
        };

        const result = await createTransactionAction(input);

        if (result.error || !result.data) {
          setErrors({ submit: result.error || "Errore durante la creazione" });
          return;
        }

        // Call success callback for optimistic UI update
        onSuccess?.(result.data, "create");
        onOpenChange(false);
      } else {
        // Update existing transaction
        if (!transaction) {
          setErrors({ submit: "Transazione non trovata" });
          return;
        }

        const result = await updateTransactionAction(transaction.id, {
          description: formData.description.trim(),
          amount,
          type: formData.type,
          category: formData.category,
          date: formData.date,
          user_id: formData.user_id,
          account_id: formData.account_id,
          to_account_id: formData.type === "transfer" ? formData.to_account_id : null,
        });

        if (result.error || !result.data) {
          setErrors({
            submit: result.error || "Errore durante l'aggiornamento",
          });
          return;
        }

        // Call success callback for optimistic UI update
        onSuccess?.(result.data, "update");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("[TransactionForm] Submit error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // When user changes, update account to user's default
      if (field === "user_id") {
        newData.account_id = getDefaultAccountId(value);
        newData.to_account_id = ""; // Clear transfer destination
      }

      return newData;
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Type options
  const typeOptions = [
    { value: "income", label: "Entrata" },
    { value: "expense", label: "Uscita" },
    { value: "transfer", label: "Trasferimento" },
  ];

  // Filter available destination accounts (exclude source account and filter by user)
  const destinationAccounts = filteredAccounts.filter((acc) => acc.id !== formData.account_id);

  return (
    <form className="space-y-4">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        titleClassName={transactionStyles.modal.title}
        descriptionClassName={transactionStyles.modal.description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === "edit" ? "Aggiorna" : "Crea"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className={transactionStyles.modal.content}>
          {/* Submit Error Display */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive font-medium">{errors.submit}</p>
            </div>
          )}

          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User */}
              <UserField
                value={formData.user_id || ""}
                onChange={(value) => handleChange("user_id", value)}
                error={errors.user_id}
                users={groupUsers}
                label="Utente"
                placeholder="Seleziona utente"
              />

              {/* Type */}
              <FormField label="Tipo" required error={errors.type}>
                <FormSelect
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value as TransactionType)}
                  options={typeOptions}
                  placeholder="Seleziona tipo"
                />
              </FormField>

              {/* Source Account */}
              <AccountField
                value={formData.account_id}
                onChange={(value) => handleChange("account_id", value)}
                error={errors.account_id}
                accounts={filteredAccounts}
                label="Conto origine"
                placeholder="Seleziona conto"
                required
              />

              {/* Destination Account (only for transfers) */}
              {formData.type === "transfer" && (
                <AccountField
                  value={formData.to_account_id}
                  onChange={(value) => handleChange("to_account_id", value)}
                  error={errors.to_account_id}
                  accounts={destinationAccounts}
                  label="Conto destinazione"
                  placeholder="Seleziona conto destinazione"
                  required
                />
              )}

              {/* Category */}
              <CategoryField
                value={formData.category}
                onChange={(value) => handleChange("category", value)}
                error={errors.category}
                categories={categories}
                label="Categoria"
                placeholder="Seleziona categoria"
                required
              />

              {/* Amount */}
              <AmountField
                value={formData.amount}
                onChange={(value) => handleChange("amount", value)}
                error={errors.amount}
                label="Importo"
                placeholder="0,00"
                required
              />

              {/* Date */}
              <DateField
                value={formData.date}
                onChange={(value) => handleChange("date", value)}
                error={errors.date}
                label="Data"
                required
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Description */}
            <FormField label="Descrizione" required error={errors.description}>
              <Input
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Es. Spesa supermercato"
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}
