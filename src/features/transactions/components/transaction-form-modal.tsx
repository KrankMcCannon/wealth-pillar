"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Transaction, TransactionType, User, Account, Category } from "@/lib/types";
import { createTransactionAction, updateTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { transactionStyles } from "@/features/transactions/theme/transaction-styles";
import { ModalWrapper, ModalContent, ModalSection } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/src/components/form";
import { UserField, AccountField, CategoryField, AmountField, DateField } from "@/src/components/ui/fields";
import { Input } from "@/src/components/ui/input";
import { usePermissions } from "@/hooks";
import { useCurrentUser, useGroupUsers, useAccounts, useCategories, useGroupId } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";

// Zod schema for transaction validation
const transactionSchema = z.object({
  description: z.string()
    .min(2, "La descrizione deve contenere almeno 2 caratteri")
    .trim(),
  amount: z.string()
    .min(1, "L'importo è obbligatorio")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "L'importo deve essere maggiore di zero"
    }),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().min(1, "La categoria è obbligatoria"),
  date: z.string().min(1, "La data è obbligatoria"),
  user_id: z.string().min(1, "L'utente è obbligatorio"),
  account_id: z.string().min(1, "Il conto è obbligatorio"),
  to_account_id: z.string().optional(),
}).refine((data) => {
  // Transfer-specific validation
  if (data.type === "transfer") {
    if (!data.to_account_id) return false;
    if (data.to_account_id === data.account_id) return false;
  }
  return true;
}, {
  message: "Il conto di destinazione è obbligatorio e deve essere diverso dal conto di origine",
  path: ["to_account_id"]
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function TransactionFormModal({
  isOpen,
  onClose,
  editId,
}: TransactionFormModalProps) {
  // Read from stores instead of props
  const currentUser = useCurrentUser();
  const groupUsers = useGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useGroupId();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Early return if store not initialized
  if (!currentUser || !groupId) {
    return null;
  }
  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica transazione" : "Nuova transazione";
  const description = isEditMode ? "Aggiorna i dettagli della transazione" : "Aggiungi una nuova transazione";

  // Permission checks
  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split("T")[0],
      user_id: defaultFormUserId,
      account_id: "",
      to_account_id: "",
    }
  });

  const watchedUserId = watch("user_id");
  const watchedType = watch("type");
  const watchedAccountId = watch("account_id");

  // Filter accounts by selected user
  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

  // Get default account for selected user
  const getDefaultAccountId = useCallback(
    (userId: string): string => {
      if (!userId) return accounts.length > 0 ? accounts[0].id : "";

      // Find user and use their default account
      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        // Verify the default account is accessible to this user
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId),
        );
        if (defaultAccount) return defaultAccount.id;
      }

      // Fall back to first account accessible to this user
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      return userAccounts.length > 0 ? userAccounts[0].id : accounts.length > 0 ? accounts[0].id : "";
    },
    [accounts, groupUsers],
  );

  // Load transaction data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // TODO: Fetch transaction by editId
      // For now, reset to defaults
      reset({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split("T")[0],
        user_id: defaultFormUserId,
        account_id: getDefaultAccountId(defaultFormUserId),
        to_account_id: "",
      });
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split("T")[0],
        user_id: defaultFormUserId,
        account_id: getDefaultAccountId(defaultFormUserId),
        to_account_id: "",
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, reset, getDefaultAccountId]);

  // Update account when user changes
  useEffect(() => {
    if (watchedUserId) {
      const newAccountId = getDefaultAccountId(watchedUserId);
      setValue("account_id", newAccountId);
      setValue("to_account_id", ""); // Clear transfer destination
    }
  }, [watchedUserId, setValue, getDefaultAccountId]);

  // Handle form submission
  const onSubmit = async (data: TransactionFormData) => {
    try {
      const amount = parseFloat(data.amount);

      if (isEditMode && editId) {
        // Update existing transaction
        const result = await updateTransactionAction(editId, {
          description: data.description.trim(),
          amount,
          type: data.type,
          category: data.category,
          date: data.date,
          user_id: data.user_id,
          account_id: data.account_id,
          to_account_id: data.type === "transfer" ? data.to_account_id : null,
        });

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      } else {
        // Create new transaction
        const result = await createTransactionAction({
          description: data.description.trim(),
          amount,
          type: data.type,
          category: data.category,
          date: data.date,
          user_id: data.user_id,
          account_id: data.account_id,
          to_account_id: data.type === "transfer" ? data.to_account_id : null,
          group_id: groupId,
        });

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      }

      // Close modal on success
      onClose();
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  };

  // Type options
  const typeOptions = [
    { value: "income", label: "Entrata" },
    { value: "expense", label: "Uscita" },
    { value: "transfer", label: "Trasferimento" },
  ];

  // Filter available destination accounts (exclude source account and filter by user)
  const destinationAccounts = filteredAccounts.filter((acc) => acc.id !== watchedAccountId);

  return (
    <form className="space-y-4">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        titleClassName={transactionStyles.modal.title}
        descriptionClassName={transactionStyles.modal.description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={isEditMode ? "Aggiorna" : "Crea"}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className={transactionStyles.modal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive font-medium">{errors.root.message}</p>
            </div>
          )}

          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User */}
              <UserField
                value={watchedUserId}
                onChange={(value) => setValue("user_id", value)}
                error={errors.user_id?.message}
                users={groupUsers}
                label="Utente"
                placeholder="Seleziona utente"
                disabled={shouldDisableUserField}
                helperText={userFieldHelperText}
              />

              {/* Type */}
              <FormField label="Tipo" required error={errors.type?.message}>
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue("type", value as TransactionType)}
                  options={typeOptions}
                  placeholder="Seleziona tipo"
                />
              </FormField>

              {/* Source Account */}
              <AccountField
                value={watchedAccountId}
                onChange={(value) => setValue("account_id", value)}
                error={errors.account_id?.message}
                accounts={filteredAccounts}
                label="Conto origine"
                placeholder="Seleziona conto"
                required
              />

              {/* Destination Account (only for transfers) */}
              {watchedType === "transfer" && (
                <AccountField
                  value={watch("to_account_id") || ""}
                  onChange={(value) => setValue("to_account_id", value)}
                  error={errors.to_account_id?.message}
                  accounts={destinationAccounts}
                  label="Conto destinazione"
                  placeholder="Seleziona conto destinazione"
                  required
                />
              )}

              {/* Category */}
              <CategoryField
                value={watch("category")}
                onChange={(value) => setValue("category", value)}
                error={errors.category?.message}
                categories={categories}
                label="Categoria"
                placeholder="Seleziona categoria"
                required
              />

              {/* Amount */}
              <AmountField
                value={watch("amount")}
                onChange={(value) => setValue("amount", value)}
                error={errors.amount?.message}
                label="Importo"
                placeholder="0,00"
                required
              />

              {/* Date */}
              <DateField
                value={watch("date")}
                onChange={(value) => setValue("date", value)}
                error={errors.date?.message}
                label="Data"
                required
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Description */}
            <FormField label="Descrizione" required error={errors.description?.message}>
              <Input
                {...register("description")}
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

// Default export for lazy loading
export default TransactionFormModal;
