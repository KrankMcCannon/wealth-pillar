import { useState } from 'react';
import { UseFormSetError } from 'react-hook-form';
import { Transaction, TransactionType } from '@/lib/types';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { getTempId } from '@/lib/utils';
import { createTransactionAction, updateTransactionAction } from '@/features/transactions';
import { toast } from '@/hooks/use-toast';

interface UseTransactionSubmitProps {
  isEditMode: boolean;
  editId?: string | null | undefined;
  groupId: string;
  storeTransactions: Transaction[];
  updateTransaction: (id: string, data: Transaction) => void;
  addTransaction: (data: Transaction) => void;
  removeTransaction: (id: string) => void;
  onClose: () => void;
  setError: UseFormSetError<TransactionSubmitData>;
  messages: {
    notFound: string;
    unknownError: string;
  };
}

export interface TransactionSubmitData {
  description: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  user_id: string;
  account_id: string;
  to_account_id?: string | undefined;
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
  messages,
}: UseTransactionSubmitProps) {
  const [isSubmittingFromHook, setIsSubmittingFromHook] = useState(false);

  const handleUpdate = async (transactionData: Partial<Transaction>) => {
    if (!editId) return;

    // 1. Store original transaction for revert
    const originalTransaction = storeTransactions.find((t) => t.id === editId);
    if (!originalTransaction) {
      setError('root', { message: messages.notFound });
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
      updateTransaction(editId, originalTransaction);
      setError('root', { message: result.error });
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
      return;
    }

    if (result.data) {
      updateTransaction(editId, result.data);
      toast({
        title: 'Transazione aggiornata',
        description: 'Modifiche salvate correttamente.',
        variant: 'success',
      });
    }
  };

  const handleCreate = async (
    transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ) => {
    // 1. Create temporary ID
    const tempId = getTempId('temp-transaction');
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
      removeTransaction(tempId);
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
      return;
    }

    removeTransaction(tempId);
    if (result.data) {
      addTransaction(result.data);
      toast({
        title: 'Transazione creata',
        description: 'Transazione aggiunta correttamente.',
        variant: 'success',
      });
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
        to_account_id: data.type === 'transfer' ? (data.to_account_id ?? null) : null,
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
      const message = error instanceof Error ? error.message : messages.unknownError;
      setError('root', { message });
      toast({ title: 'Errore', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingFromHook(false);
    }
  };

  return { handleSubmit, isSubmitting: isSubmittingFromHook };
}
