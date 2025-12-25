"use client";

import { useQueryState, parseAsString } from 'nuqs';

export const MODAL_TYPES = [
  'transaction',
  'budget',
  'category',
  'recurring',
  'account'
] as const;

export type ModalType = typeof MODAL_TYPES[number];

/**
 * Hook for managing modal state via URL params
 * Provides type-safe URL-based modal state management
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
  const [modal, setModal] = useQueryState('modal', parseAsString);
  const [editId, setEditId] = useQueryState('editId', parseAsString);

  return {
    modal: modal as ModalType | null,
    editId,
    isOpen: (type: ModalType) => modal === type,
    openModal: (type: ModalType, id?: string) => {
      setModal(type);
      if (id) setEditId(id);
    },
    closeModal: () => {
      setModal(null);
      setEditId(null);
    }
  };
}
