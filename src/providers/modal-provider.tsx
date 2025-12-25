"use client";

import { lazy, Suspense } from "react";
import dynamic from 'next/dynamic';
import { useModalState } from "@/lib/navigation/modal-params";
import { useUserFilterStore } from "@/stores/user-filter-store";
import type { User, Account, Category } from "@/lib/types";

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
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  categories: Category[];
  groupId: string;
}

/**
 * Inner Modal Renderer (uses hooks that access search params)
 * Wrapped in Suspense by parent to prevent SSR issues
 */
function ModalRenderer({
  currentUser,
  groupUsers,
  accounts,
  categories,
  groupId
}: Omit<ModalProviderProps, 'children'>) {
  const { modal, editId, closeModal } = useModalState();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

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
 * - Provides data from layout to all modals
 * - Handles modal open/close via URL params
 */
export function ModalProvider({
  children,
  currentUser,
  groupUsers,
  accounts,
  categories,
  groupId
}: ModalProviderProps) {
  return (
    <>
      {children}

      {/* Modal Rendering - Client-only (no SSR) to prevent searchParams issues */}
      <DynamicModalRenderer
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={groupId}
      />
    </>
  );
}
