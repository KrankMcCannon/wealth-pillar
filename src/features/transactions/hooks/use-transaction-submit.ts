import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { UseFormSetError } from 'react-hook-form';
import { TransactionType } from '@/lib/types';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { createTransactionAction, updateTransactionAction } from '@/features/transactions';
import { toast } from '@/hooks/use-toast';

interface UseTransactionSubmitProps {
  isEditMode: boolean;
  editId?: string | null | undefined;
  groupId: string;
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
  onClose,
  setError,
  messages,
}: UseTransactionSubmitProps) {
  const router = useRouter();
  const [isSubmittingFromHook, setIsSubmittingFromHook] = useState(false);

  const handleUpdate = async (transactionData: Record<string, unknown>) => {
    if (!editId) return;

    const result = await updateTransactionAction(editId, {
      ...transactionData,
      group_id: (transactionData.group_id as string) || undefined,
    } as Partial<CreateTransactionInput>);

    if (result.error) {
      setError('root', { message: result.error });
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Transazione aggiornata',
      description: 'Modifiche salvate correttamente.',
      variant: 'success',
    });
    onClose();
    router.refresh();
  };

  const handleCreate = async (
    transactionData: Omit<Record<string, unknown>, 'id' | 'created_at' | 'updated_at'>
  ) => {
    onClose();

    const result = await createTransactionAction({
      ...transactionData,
      group_id: (transactionData.group_id as string) || groupId,
    } as CreateTransactionInput);

    if (result.error) {
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Transazione creata',
      description: 'Transazione aggiunta correttamente.',
      variant: 'success',
    });
    router.refresh();
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
