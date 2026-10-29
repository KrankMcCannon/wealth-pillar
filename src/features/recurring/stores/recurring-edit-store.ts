import { create } from 'zustand';
import type { RecurringTransactionSeries } from '@/lib/types';

interface RecurringEditState {
  seed: RecurringTransactionSeries | null;
  setSeed: (series: RecurringTransactionSeries) => void;
  clearSeed: () => void;
}

export const useRecurringEditStore = create<RecurringEditState>((set) => ({
  seed: null,
  setSeed: (series) => set({ seed: series }),
  clearSeed: () => set({ seed: null }),
}));
