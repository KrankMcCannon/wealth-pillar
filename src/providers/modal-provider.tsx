"use client";

import { lazy, Suspense } from "react";
import dynamic from 'next/dynamic';
import { useModalState } from "@/lib/navigation/url-state";
import {
  useRequiredCurrentUser,
  useRequiredGroupId,
} from "@/hooks/use-required-user";

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

  // Read from context
  useRequiredCurrentUser();
  useRequiredGroupId();


  return (
    <Suspense fallback={null}>
      {modal === "transaction" && (
        <TransactionFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
        />
      )}

      {modal === "budget" && (
        <BudgetFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
        />
      )}

      {modal === "category" && (
        <CategoryFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
        />
      )}

      {modal === "recurring" && (
        <RecurringFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
        />
      )}

      {modal === "account" && (
        <AccountFormModal
          isOpen={true}
          onClose={closeModal}
          editId={editId}
        />
      )}
    </Suspense>
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
}: Readonly<ModalProviderProps>) {
  return (
    <>
      {children}

      {/* Modal Rendering - Client-only (no SSR) to prevent searchParams issues */}
      <DynamicModalRenderer />
    </>
  );
}
