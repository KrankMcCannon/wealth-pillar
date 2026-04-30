import { create } from 'zustand';

interface TransactionDeleteRequestState {
  pendingTransactionId: string | null;
  requestDelete: (transactionId: string) => void;
  consumePendingDelete: () => string | null;
}

export const useTransactionDeleteRequestStore = create<TransactionDeleteRequestState>(
  (set, get) => ({
    pendingTransactionId: null,
    requestDelete: (transactionId: string) => set({ pendingTransactionId: transactionId }),
    consumePendingDelete: () => {
      const pendingTransactionId = get().pendingTransactionId;
      if (pendingTransactionId) {
        set({ pendingTransactionId: null });
      }
      return pendingTransactionId;
    },
  })
);
