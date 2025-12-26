"use client";

import { lazy } from "react";
import dynamic from 'next/dynamic';
import { useModalState } from "@/lib/navigation/modal-params";
import { useUserFilterStore } from "@/stores/user-filter-store";
import {
  useCurrentUser,
  useGroupUsers,
  useAccounts,
  useCategories,
  useGroupId,
} from "@/stores/reference-data-store";

// Lazy load modals - only loaded when opened
const TransactionFormModal = lazy(() =>
  import("@/features/transactions/components/transaction-form-modal")
);
const BudgetFormModal = lazy(() =>
  import("@/features/budgets/components/budget-form-modal")
);
const CategoryFormModal = lazy(() =>
  import("@/features/categories/components/category-form-modal")
);
const RecurringFormModal = lazy(() =>
  import("@/features/recurring/components/recurring-form-modal")
);
const AccountFormModal = lazy(() =>
  import("@/features/accounts/components/account-form-modal")
);

interface ModalProviderProps {
  children: React.ReactNode;
}

/**
 * Inner Modal Renderer (uses hooks that access search params and stores)
 * Wrapped in Suspense by parent to prevent SSR issues
 */
function ModalRenderer() {
  const { modal, editId, closeModal } = useModalState();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Read from stores instead of props
  const currentUser = useCurrentUser();
  const groupUsers = useGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useGroupId();

  // Don't render modals until store is initialized
  if (!currentUser || !groupId) {
    return null;
  }

  return (
    <>
      {modal === "transaction" && (
        <TransactionFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
          currentUser={currentUser}
          groupUsers={groupUsers}
          accounts={accounts}
          categories={categories}
          groupId={groupId}
          selectedUserId={selectedUserId}
        />
      )}

      {modal === "budget" && (
        <BudgetFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
          currentUser={currentUser}
          groupUsers={groupUsers}
          categories={categories}
          selectedUserId={selectedUserId}
        />
      )}

      {modal === "category" && (
        <CategoryFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
          groupId={groupId}
        />
      )}

      {modal === "recurring" && (
        <RecurringFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
          currentUser={currentUser}
          groupUsers={groupUsers}
          accounts={accounts}
          categories={categories}
          selectedUserId={selectedUserId}
        />
      )}

      {modal === "account" && (
        <AccountFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
          currentUser={currentUser}
          groupUsers={groupUsers}
          groupId={groupId}
          selectedUserId={selectedUserId}
        />
      )}
    </>
  );
}

// Dynamic import of ModalRenderer with SSR disabled to prevent searchParams access during build
const DynamicModalRenderer = dynamic(
  () => Promise.resolve(ModalRenderer),
  { ssr: false }
);

/**
 * Global Modal Provider
 *
 * Manages all application modals via URL state (nuqs)
 * - Lazy loads modals only when needed
 * - Reads data from Zustand stores (no props needed)
 * - Handles modal open/close via URL params
 */
export function ModalProvider({
  children,
}: ModalProviderProps) {
  return (
    <>
      {children}

      {/* Modal Rendering - Client-only (no SSR) to prevent searchParams issues */}
      <DynamicModalRenderer />
    </>
  );
}
