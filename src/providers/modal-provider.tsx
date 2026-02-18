'use client';

import { lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useModalState, type ModalType } from '@/lib/navigation/url-state';
import { useRequiredCurrentUser, useRequiredGroupId } from '@/hooks/use-required-user';

// ============================================================================
// MODAL COMPONENTS (LAZY LOADED)
// ============================================================================

const TransactionFormModal = lazy(
  () => import('@/features/transactions/components/transaction-form-modal')
);
const BudgetFormModal = lazy(() => import('@/features/budgets/components/budget-form-modal'));
const CategoryFormModal = lazy(
  () => import('@/features/categories/components/category-form-modal')
);
const RecurringFormModal = lazy(
  () => import('@/features/recurring/components/recurring-form-modal')
);
const AccountFormModal = lazy(() => import('@/features/accounts/components/account-form-modal'));
const AddInvestmentModal = lazy(() => import('@/components/investments/add-investment-modal'));

// ============================================================================
// TYPES & MAPPINGS
// ============================================================================

/**
 * Standardized props for all feature modals.
 * Allows for type-safe mapping of modal components.
 */
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

/**
 * Map of modal identifiers to their respective components.
 * Cast to unknown then BaseModalProps to handle modals that don't need editId.
 */
const MODAL_MAPPING: Record<ModalType, React.ComponentType<BaseModalProps>> = {
  transaction: TransactionFormModal,
  budget: BudgetFormModal,
  category: CategoryFormModal,
  recurring: RecurringFormModal,
  account: AccountFormModal,
  investment: AddInvestmentModal as unknown as React.ComponentType<BaseModalProps>,
};

interface ModalProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// MODAL RENDERER
// ============================================================================

/**
 * Inner Modal Renderer (uses hooks that access search params and stores)
 * Wrapped in Suspense by parent to prevent SSR issues
 */
function ModalRenderer() {
  const { modal, editId, closeModal } = useModalState();

  // Read from context - these hooks ensure data is available
  useRequiredCurrentUser();
  useRequiredGroupId();

  if (!modal) return null;

  const ActiveModal = MODAL_MAPPING[modal];

  return (
    <Suspense fallback={null}>
      <ActiveModal isOpen={true} onClose={closeModal} editId={editId} />
    </Suspense>
  );
}

// Dynamic import of ModalRenderer with SSR disabled to prevent searchParams access during build
const DynamicModalRenderer = dynamic(() => Promise.resolve(ModalRenderer), { ssr: false });

/**
 * Global Modal Provider
 *
 * Manages all application modals via URL state (nuqs)
 * - Lazy loads modals only when needed
 * - Reads data from Zustand stores (no props needed)
 * - Handles modal open/close via URL params
 */
export function ModalProvider({ children }: Readonly<ModalProviderProps>) {
  return (
    <>
      {children}

      {/* Modal Rendering - Client-only (no SSR) to prevent searchParams issues */}
      <DynamicModalRenderer />
    </>
  );
}
