"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for managing form modal state
 * Handles create/edit modes and entity state
 *
 * @template T - Type of entity being created/edited
 * @returns Modal state and control functions
 *
 * @example
 * ```tsx
 * const transactionModal = useFormModal<Transaction>();
 *
 * // Open for create
 * transactionModal.openCreate();
 *
 * // Open for edit
 * transactionModal.openEdit(transaction);
 *
 * // In JSX
 * <TransactionForm
 *   isOpen={transactionModal.isOpen}
 *   mode={transactionModal.mode}
 *   transaction={transactionModal.entity}
 *   onClose={transactionModal.close}
 * />
 * ```
 */
export function useFormModal<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [entity, setEntity] = useState<T | undefined>();

  const openCreate = useCallback(() => {
    setMode('create');
    setEntity(undefined);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setMode('edit');
    setEntity(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEntity(undefined);
  }, []);

  return {
    isOpen,
    mode,
    entity,
    openCreate,
    openEdit,
    close,
    setIsOpen, // For manual control if needed
  };
}
