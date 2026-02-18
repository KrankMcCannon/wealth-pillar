'use client';

import { useQueryState, parseAsString, useQueryStates } from 'nuqs';

export const MODAL_TYPES = [
  'transaction',
  'budget',
  'category',
  'recurring',
  'account',
  'investment',
] as const;

export type ModalType = (typeof MODAL_TYPES)[number];

/**
 * Hook for managing modal state via URL params
 * Provides type-safe URL-based modal state management with atomic updates.
 *
 * Uses shallow updates by default to prevent unnecessary server-side re-renders.
 *
 * @example
 * const { modal, openModal, closeModal } = useModalState();
 *
 * // Open transaction modal
 * openModal('transaction');
 *
 * // Open transaction modal in edit mode
 * openModal('transaction', 'transaction-id-123');
 *
 * // Close modal
 * closeModal();
 */
export function useModalState() {
  const [states, setStates] = useQueryStates(
    {
      modal: parseAsString,
      editId: parseAsString,
    },
    {
      shallow: true,
      history: 'push',
    }
  );

  const { modal, editId } = states;

  return {
    modal: modal as ModalType | null,
    editId,
    /** Checks if a specific modal type is open */
    isOpen: (type: ModalType) => modal === type,
    /**
     * Opens a modal of the specified type, optionally with an edit ID.
     * Both params are updated atomically in the URL.
     */
    openModal: (type: ModalType, id?: string) => {
      void setStates({
        modal: type,
        editId: id ?? null,
      });
    },
    /**
     * Closes the current modal and clears any edit ID.
     * Both params are cleared atomically in the URL.
     */
    closeModal: () => {
      void setStates({
        modal: null,
        editId: null,
      });
    },
  };
}

/**
 * Hook for managing tab state via URL params
 * Persists active tab in URL for shareable links and browser navigation
 *
 * @param defaultTab - The default tab to show if no tab is in URL
 * @returns Object with activeTab and setActiveTab
 *
 * @example
 * const { activeTab, setActiveTab } = useTabState('Transactions');
 *
 * // activeTab will be 'Transactions' initially
 * // setActiveTab('Recurrent') will update URL to ?tab=Recurrent
 */
export function useTabState(defaultTab: string) {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault(defaultTab));
  return { activeTab: tab, setActiveTab: setTab };
}
