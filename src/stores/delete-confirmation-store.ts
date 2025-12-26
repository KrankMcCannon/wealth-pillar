/**
 * Delete Confirmation Store
 *
 * Centralized state management for delete confirmation dialogs.
 * Replaces the useDeleteConfirmation hook with a global store.
 *
 * @module stores/delete-confirmation-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface DeleteConfirmationStore {
  // State
  isOpen: boolean;
  entityType: string | null;
  entityId: string | null;
  entityData: any | null;
  isDeleting: boolean;

  // Actions
  openDialog: (type: string, id: string, data: any) => void;
  closeDialog: () => void;
  setDeleting: (deleting: boolean) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  isOpen: false,
  entityType: null,
  entityId: null,
  entityData: null,
  isDeleting: false,
};

// ============================================================================
// Store
// ============================================================================

export const useDeleteConfirmationStore = create<DeleteConfirmationStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Open dialog
      openDialog: (type, id, data) => {
        set(
          {
            isOpen: true,
            entityType: type,
            entityId: id,
            entityData: data,
            isDeleting: false,
          },
          false,
          'delete-confirmation/openDialog'
        );
      },

      // Close dialog
      closeDialog: () => {
        set(initialState, false, 'delete-confirmation/closeDialog');
      },

      // Set deleting state
      setDeleting: (deleting) => {
        set({ isDeleting: deleting }, false, 'delete-confirmation/setDeleting');
      },

      // Reset
      reset: () => {
        set(initialState, false, 'delete-confirmation/reset');
      },
    }),
    { name: 'DeleteConfirmation' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get delete confirmation state
 */
export const useDeleteConfirmation = () =>
  useDeleteConfirmationStore((state) => ({
    isOpen: state.isOpen,
    entityType: state.entityType,
    entityId: state.entityId,
    entityData: state.entityData,
    isDeleting: state.isDeleting,
  }));

/**
 * Get delete confirmation actions
 */
export const useDeleteConfirmationActions = () =>
  useDeleteConfirmationStore((state) => ({
    openDialog: state.openDialog,
    closeDialog: state.closeDialog,
    setDeleting: state.setDeleting,
    reset: state.reset,
  }));

/**
 * Check if delete dialog is open
 */
export const useIsDeleteDialogOpen = () =>
  useDeleteConfirmationStore((state) => state.isOpen);

/**
 * Check if deleting is in progress
 */
export const useIsDeleting = () =>
  useDeleteConfirmationStore((state) => state.isDeleting);
