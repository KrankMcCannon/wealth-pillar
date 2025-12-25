import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserFilterState {
  selectedGroupFilter: string;
  selectedUserId: string | undefined;
  setSelectedGroupFilter: (filter: string) => void;
  reset: () => void;
}

export const useUserFilterStore = create<UserFilterState>()(
  persist(
    (set) => ({
      selectedGroupFilter: 'all',
      selectedUserId: undefined,

      setSelectedGroupFilter: (filter: string) =>
        set({
          selectedGroupFilter: filter,
          selectedUserId: filter === 'all' ? undefined : filter
        }),

      reset: () => set({
        selectedGroupFilter: 'all',
        selectedUserId: undefined
      }),
    }),
    {
      name: 'wealth-pillar-user-filter',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selettori ottimizzati per performance
export const useSelectedUserId = () =>
  useUserFilterStore(state => state.selectedUserId);

export const useSelectedGroupFilter = () =>
  useUserFilterStore(state => state.selectedGroupFilter);

export const useSetSelectedGroupFilter = () =>
  useUserFilterStore(state => state.setSelectedGroupFilter);
