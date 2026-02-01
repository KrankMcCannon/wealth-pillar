import { useState } from "react";
import { UseFormSetError } from "react-hook-form";
import { Transaction, TransactionType } from "@/lib/types";
import { CreateTransactionInput } from "@/server/services";
import { getTempId } from "@/lib/utils";
import { createTransactionAction, updateTransactionAction } from "@/features/transactions";

interface UseTransactionSubmitProps {
  isEditMode: boolean;
  editId?: string | null;
  groupId: string;
  storeTransactions: Transaction[];
  updateTransaction: (id: string, data: Transaction) => void;
  addTransaction: (data: Transaction) => void;
  removeTransaction: (id: string) => void;
  onClose: () => void;
  setError: UseFormSetError<TransactionSubmitData>;
}

export interface TransactionSubmitData {
  description: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  user_id: string;
  account_id: string;
  to_account_id?: string;
}

export function useTransactionSubmit({
  isEditMode,
  editId,
  groupId,
  storeTransactions,
  updateTransaction,
  addTransaction,
  removeTransaction,
  onClose,
  setError,
}: UseTransactionSubmitProps) {
  const [isSubmittingFromHook, setIsSubmittingFromHook] = useState(false);

  const handleUpdate = async (transactionData: Partial<Transaction>) => {
    if (!editId) return;
    
    // 1. Store original transaction for revert
    const originalTransaction = storeTransactions.find((t) => t.id === editId);
    if (!originalTransaction) {
      setError("root", { message: "Transazione non trovata" });
      return;
    }

    // 2. Update in store immediately (optimistic)
    updateTransaction(editId, { ...originalTransaction, ...transactionData });

    // 3. Call server action
    const result = await updateTransactionAction(editId, {
      ...transactionData,
      group_id: transactionData.group_id || undefined,
    } as Partial<CreateTransactionInput>);

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
  };

  const handleCreate = async (transactionData: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
    // 1. Create temporary ID
    const tempId = getTempId("temp-transaction");
    const now = new Date().toISOString();
    const optimisticTransaction: Transaction = {
      id: tempId,
      created_at: now,
      updated_at: now,
      ...transactionData,
    } as Transaction;

    // 2. Add to store immediately (optimistic)
    addTransaction(optimisticTransaction);

    // 3. Close modal immediately for better UX
    onClose();

    // 4. Call server action in background
    const result = await createTransactionAction({
      ...transactionData,
      group_id: transactionData.group_id || groupId,
    } as CreateTransactionInput);

    if (result.error) {
      // 5. Remove optimistic transaction on error
      removeTransaction(tempId);
      console.error("Failed to create transaction:", result.error);
      return;
    }

    // 6. Replace temporary with real transaction from server
    removeTransaction(tempId);
    if (result.data) {
      addTransaction(result.data);
    }
  };

  const handleSubmit = async (data: TransactionSubmitData) => {
    setIsSubmittingFromHook(true);
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
        await handleUpdate(transactionData);
      } else {
        await handleCreate(transactionData);
      }

      // Close modal on success (for update mode)
      if (isEditMode) onClose();
    } catch (error) {
      console.error("Submission error:", error);
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    } finally {
      setIsSubmittingFromHook(false);
    }
  };

  return { handleSubmit, isSubmitting: isSubmittingFromHook };
}
