import { create } from 'zustand';
import type { Transaction } from '@/lib/types';

interface TransactionEditState {
  seed: Transaction | null;
  setSeed: (transaction: Transaction) => void;
  clearSeed: () => void;
}

export const useTransactionEditStore = create<TransactionEditState>((set) => ({
  seed: null,
  setSeed: (transaction) => set({ seed: transaction }),
  clearSeed: () => set({ seed: null }),
}));
