"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for managing delete confirmation dialogs
 * Handles confirmation dialog state, item tracking, and delete execution
 *
 * @template T - Type of item being deleted
 * @returns Delete confirmation state and control functions
 *
 * @example
 * ```tsx
 * const deleteConfirm = useDeleteConfirmation<Transaction>();
 *
 * // Open delete dialog
 * deleteConfirm.openDialog(transaction);
 *
 * // Execute delete
 * const handleDelete = async () => {
 *   await deleteConfirm.executeDelete(async (item) => {
 *     await deleteTransactionAction(item.id);
 *   });
 * };
 *
 * // In JSX
 * <ConfirmationDialog
 *   isOpen={deleteConfirm.isOpen}
 *   isLoading={deleteConfirm.isDeleting}
 *   onClose={deleteConfirm.closeDialog}
 *   onConfirm={handleDelete}
 *   title="Delete Transaction?"
 * />
 * ```
 */
export function useDeleteConfirmation<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = useCallback((item: T) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setItemToDelete(null);
    setIsDeleting(false);
  }, []);

  const executeDelete = useCallback(
    async (deleteAction: (item: T) => Promise<void>) => {
      if (!itemToDelete) return;

      setIsDeleting(true);
      try {
        await deleteAction(itemToDelete);
        closeDialog();
      } catch (error) {
        setIsDeleting(false);
        throw error;
      }
    },
    [itemToDelete, closeDialog]
  );

  return {
    isOpen,
    itemToDelete,
    isDeleting,
    openDialog,
    closeDialog,
    executeDelete,
  };
}
