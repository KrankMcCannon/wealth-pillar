/**
 * Reference Data Store
 *
 * Centralized state management for reference data (users, accounts, categories).
 * Eliminates props drilling across 20+ components and enables optimistic updates.
 *
 * @module stores/reference-data-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { User, Account, Category } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ReferenceDataState {
  // Data
  currentUser: User | null;
  groupUsers: User[];
  accounts: Account[];
  categories: Category[];
  groupId: string | null;
  isInitialized: boolean;

  // Initialization
  initialize: (data: {
    currentUser: User;
    groupUsers: User[];
    accounts: Account[];
    categories: Category[];
  }) => void;
  reset: () => void;

  // User optimistic update actions
  updateCurrentUser: (updates: Partial<User>) => void;

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
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentUser: null,
  groupUsers: [],
  accounts: [],
  categories: [],
  groupId: null,
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
        set({
          currentUser: data.currentUser,
          groupUsers: data.groupUsers,
          accounts: data.accounts,
          categories: data.categories,
          groupId: data.currentUser.group_id,
          isInitialized: true,
        }, false, 'reference-data/initialize');
      },

      // Reset store to initial state
      reset: () => {
        set(initialState, false, 'reference-data/reset');
      },

      // User actions
      updateCurrentUser: (updates) => {
        set((state) => ({
          currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
        }), false, 'reference-data/updateCurrentUser');
      },

      // Account actions
      addAccount: (account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }), false, 'reference-data/addAccount');
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id ? { ...account, ...updates } : account
          ),
        }), false, 'reference-data/updateAccount');
      },

      removeAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== id),
        }), false, 'reference-data/removeAccount');
      },

      refreshAccounts: (accounts) => {
        set({ accounts }, false, 'reference-data/refreshAccounts');
      },

      // Category actions
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, category],
        }), false, 'reference-data/addCategory');
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.key === id ? { ...category, ...updates } : category
          ),
        }), false, 'reference-data/updateCategory');
      },

      removeCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.key !== id),
        }), false, 'reference-data/removeCategory');
      },

      refreshCategories: (categories) => {
        set({ categories }, false, 'reference-data/refreshCategories');
      },
    }),
    { name: 'ReferenceData' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get current user
 * Subscribes only to currentUser changes
 */
export const useCurrentUser = () =>
  useReferenceDataStore((state) => state.currentUser);

/**
 * Get group users
 * Subscribes only to groupUsers changes
 */
export const useGroupUsers = () =>
  useReferenceDataStore((state) => state.groupUsers);

/**
 * Get accounts
 * Subscribes only to accounts changes
 */
export const useAccounts = () =>
  useReferenceDataStore((state) => state.accounts);

/**
 * Get categories
 * Subscribes only to categories changes
 */
export const useCategories = () =>
  useReferenceDataStore((state) => state.categories);

/**
 * Get group ID
 * Subscribes only to groupId changes
 */
export const useGroupId = () =>
  useReferenceDataStore((state) => state.groupId);

/**
 * Get initialization status
 * Subscribes only to isInitialized changes
 */
export const useIsInitialized = () =>
  useReferenceDataStore((state) => state.isInitialized);

/**
 * Get all reference data at once
 * Use this only when you need ALL reference data
 * For most cases, use individual selectors to prevent unnecessary re-renders
 */
export const useReferenceData = () =>
  useReferenceDataStore(
    useShallow((state) => ({
      currentUser: state.currentUser,
      groupUsers: state.groupUsers,
      accounts: state.accounts,
      categories: state.categories,
      groupId: state.groupId,
    }))
  );
