/**
 * Reference Data Store
 *
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Account, Budget, Category } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ReferenceDataState {
  // Data
  accounts: Account[];
  categories: Category[];
  usedCategoryKeys: string[];
  budgets: Budget[];
  isInitialized: boolean;

  // Initialization
  initialize: (data: {
    accounts: Account[];
    categories: Category[];
    usedCategoryKeys?: string[];
  }) => void;
  reset: () => void;

  // Account optimistic update actions
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  refreshAccounts: (accounts: Account[]) => void;

  // Category optimistic update actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  refreshCategories: (categories: Category[]) => void;

  // Budget optimistic update actions
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  refreshBudgets: (budgets: Budget[]) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  accounts: [],
  categories: [],
  usedCategoryKeys: [] as string[],
  budgets: [],
  isInitialized: false,
};

// ============================================================================
// Store
// ============================================================================

export const useReferenceDataStore = create<ReferenceDataState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Initialize store with data from server
      initialize: (data) => {
        set(
          {
            accounts: data.accounts,
            categories: data.categories,
            usedCategoryKeys: data.usedCategoryKeys ?? [],
            isInitialized: true,
          },
          false,
          'reference-data/initialize'
        );
      },

      // Reset store to initial state
      reset: () => {
        set(initialState, false, 'reference-data/reset');
      },

      // Account actions
      addAccount: (account) => {
        set(
          (state) => ({
            accounts: [...state.accounts, account],
          }),
          false,
          'reference-data/addAccount'
        );
      },

      updateAccount: (id, updates) => {
        set(
          (state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? { ...account, ...updates } : account
            ),
          }),
          false,
          'reference-data/updateAccount'
        );
      },

      removeAccount: (id) => {
        set(
          (state) => ({
            accounts: state.accounts.filter((account) => account.id !== id),
          }),
          false,
          'reference-data/removeAccount'
        );
      },

      refreshAccounts: (accounts) => {
        set({ accounts }, false, 'reference-data/refreshAccounts');
      },

      // Category actions
      addCategory: (category) => {
        set(
          (state) => ({
            categories: [...state.categories, category],
          }),
          false,
          'reference-data/addCategory'
        );
      },

      updateCategory: (id, updates) => {
        set(
          (state) => ({
            categories: state.categories.map((category) =>
              category.key === id ? { ...category, ...updates } : category
            ),
          }),
          false,
          'reference-data/updateCategory'
        );
      },

      removeCategory: (id) => {
        set(
          (state) => ({
            categories: state.categories.filter((category) => category.key !== id),
          }),
          false,
          'reference-data/removeCategory'
        );
      },

      refreshCategories: (categories) => {
        set({ categories }, false, 'reference-data/refreshCategories');
      },

      // Budget actions
      addBudget: (budget) => {
        set(
          (state) => ({
            budgets: [...state.budgets, budget],
          }),
          false,
          'reference-data/addBudget'
        );
      },

      updateBudget: (id, updates) => {
        set(
          (state) => ({
            budgets: state.budgets.map((budget) =>
              budget.id === id ? { ...budget, ...updates } : budget
            ),
          }),
          false,
          'reference-data/updateBudget'
        );
      },

      removeBudget: (id) => {
        set(
          (state) => ({
            budgets: state.budgets.filter((budget) => budget.id !== id),
          }),
          false,
          'reference-data/removeBudget'
        );
      },

      refreshBudgets: (budgets) => {
        set({ budgets }, false, 'reference-data/refreshBudgets');
      },
    }),
    { name: 'ReferenceData' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get accounts
 * Subscribes only to accounts changes
 */
export const useAccounts = () => useReferenceDataStore((state) => state.accounts);

/**
 * Get categories
 * Subscribes only to categories changes
 */
export const useCategories = () => useReferenceDataStore((state) => state.categories);

/**
 * Get category keys in use by transactions within the current group
 */
export const useUsedCategoryKeys = () => useReferenceDataStore((state) => state.usedCategoryKeys);

/**
 * Get budgets
 * Subscribes only to budgets changes
 */
export const useBudgets = () => useReferenceDataStore((state) => state.budgets);

/**
 * Get initialization status
 * Subscribes only to isInitialized changes
 */
export const useIsInitialized = () => useReferenceDataStore((state) => state.isInitialized);

/**
 * Get all reference data at once
 */
export const useReferenceData = () =>
  useReferenceDataStore(
    useShallow((state) => ({
      accounts: state.accounts,
      categories: state.categories,
    }))
  );
