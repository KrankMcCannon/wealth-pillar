"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Transaction, TransactionType } from "@/lib/types";
import { getTempId } from "@/lib/utils/temp-id";
import { createTransactionAction, updateTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { transactionStyles } from "@/features/transactions/theme/transaction-styles";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/components/form";
import { UserField, AccountField, CategoryField, AmountField, DateField } from "@/components/ui/fields";
import { Input } from "@/components/ui/input";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from "@/hooks";
import { useAccounts, useCategories } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";
import { usePageDataStore } from "@/stores/page-data-store";

// Zod schema for transaction validation
const transactionSchema = z.object({
  description: z.string()
    .min(2, "La descrizione deve contenere almeno 2 caratteri")
    .trim(),
  amount: z.string()
    .min(1, "L'importo è obbligatorio")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
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
}: Readonly<TransactionFormModalProps>) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeTransactions = usePageDataStore((state) => state.transactions);
  const addTransaction = usePageDataStore((state) => state.addTransaction);
  const updateTransaction = usePageDataStore((state) => state.updateTransaction);
  const removeTransaction = usePageDataStore((state) => state.removeTransaction);

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
    control,
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

  const watchedUserId = useWatch({ control, name: "user_id" });
  const watchedType = useWatch({ control, name: "type" });
  const watchedAccountId = useWatch({ control, name: "account_id" });
  const watchedToAccountId = useWatch({ control, name: "to_account_id" });
  const watchedCategory = useWatch({ control, name: "category" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedDate = useWatch({ control, name: "date" });

  // Filter accounts by selected user
  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

  const previousUserIdRef = useRef<string | null>(null);

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
      // Find transaction in store
      const transaction = storeTransactions.find((t) => t.id === editId);

      if (transaction) {
        // Handle date formatting (could be string or Date)
        const dateStr = typeof transaction.date === "string"
          ? transaction.date.split("T")[0]
          : (transaction.date).toISOString().split("T")[0];

        reset({
          description: transaction.description,
          amount: transaction.amount.toString(),
          type: transaction.type,
          category: transaction.category,
          date: dateStr,
          user_id: transaction.user_id || "",
          account_id: transaction.account_id,
          to_account_id: transaction.to_account_id || "",
        });
        previousUserIdRef.current = transaction.user_id || "";
      }
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
      previousUserIdRef.current = defaultFormUserId;
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, reset, getDefaultAccountId, storeTransactions]);

  useEffect(() => {
    if (!isOpen) {
      previousUserIdRef.current = null;
    }
  }, [isOpen]);

  // Update account when user changes (create mode only)
  useEffect(() => {
    if (!isEditMode && watchedUserId) {
      const accountIsValid =
        !!watchedAccountId && filteredAccounts.some((acc) => acc.id === watchedAccountId);
      const previousUserId = previousUserIdRef.current;

      if (accountIsValid && (!previousUserId || previousUserId === watchedUserId)) {
        previousUserIdRef.current = watchedUserId;
        return;
      }

      if (!accountIsValid || (previousUserId && previousUserId !== watchedUserId)) {
        const newAccountId = getDefaultAccountId(watchedUserId);
        setValue("account_id", newAccountId);
        setValue("to_account_id", ""); // Clear transfer destination
      }

      previousUserIdRef.current = watchedUserId;
    }
  }, [isEditMode, watchedUserId, watchedAccountId, filteredAccounts, setValue, getDefaultAccountId]);

  // Handle form submission with optimistic updates
  const onSubmit = async (data: TransactionFormData) => {
    try {
      const amount = Number.parseFloat(data.amount);
      const transactionData = {
        description: data.description.trim(),
        amount,
        type: data.type as TransactionType,
        category: data.category,
        date: data.date,
        user_id: data.user_id,
        account_id: data.account_id,
        to_account_id: data.type === "transfer" ? data.to_account_id : null,
        group_id: groupId,
      };

      if (isEditMode && editId) {
        // UPDATE: Optimistic update pattern
        // 1. Store original transaction for revert
        const originalTransaction = storeTransactions.find((t) => t.id === editId);
        if (!originalTransaction) {
          setError("root", { message: "Transazione non trovata" });
          return;
        }

        // 2. Update in store immediately (optimistic)
        updateTransaction(editId, transactionData);

        // 3. Call server action
        const result = await updateTransactionAction(editId, transactionData);

        if (result.error) {
          // 4. Revert on error
          updateTransaction(editId, originalTransaction);
          setError("root", { message: result.error });
          return;
        }

        // 5. Success - update with real data from server
        if (result.data) {
          updateTransaction(editId, result.data);
        }
      } else {
        // CREATE: Optimistic add pattern
        // 1. Create temporary ID
        const tempId = getTempId("temp-transaction");
        const now = new Date().toISOString();
        const optimisticTransaction: Transaction = {
          id: tempId,
          created_at: now,
          updated_at: now,
          ...transactionData,
        };

        // 2. Add to store immediately (optimistic)
        addTransaction(optimisticTransaction);

        // 3. Close modal immediately for better UX
        onClose();

        // 4. Call server action in background
        const result = await createTransactionAction(transactionData);

        if (result.error) {
          // 5. Remove optimistic transaction on error
          removeTransaction(tempId);
          // Note: Modal is already closed, error handling could be improved
          console.error("Failed to create transaction:", result.error);
          return;
        }

        // 6. Replace temporary with real transaction from server
        removeTransaction(tempId);
        if (result.data) {
          addTransaction(result.data);
        }
        return; // Early return since modal already closed
      }

      // Close modal on success (for update mode)
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
    <form className={transactionStyles.form.container}>
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
            <div className={transactionStyles.form.error}>
              <p className={transactionStyles.form.errorText}>{errors.root.message}</p>
            </div>
          )}

          <ModalSection>
            <div className={transactionStyles.form.grid}>
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
                  value={watchedToAccountId || ""}
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
                value={watchedCategory}
                onChange={(value) => setValue("category", value)}
                error={errors.category?.message}
                categories={categories}
                label="Categoria"
                placeholder="Seleziona categoria"
                required
              />

              {/* Amount */}
              <AmountField
                value={watchedAmount}
                onChange={(value) => setValue("amount", value)}
                error={errors.amount?.message}
                label="Importo"
                placeholder="0,00"
                required
              />

              {/* Date */}
              <DateField
                value={watchedDate}
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
