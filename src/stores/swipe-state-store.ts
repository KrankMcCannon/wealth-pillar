/**
 * Swipe State Store
 *
 * Global state management for swipeable card interactions.
 * Ensures only ONE card is swiped open across the entire app (Apple UX pattern).
 *
 * @module stores/swipe-state-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface SwipeStateStore {
  // State: Currently open card ID (null if no card is open)
  openCardId: string | null;

  // Actions
  setOpenCard: (id: string | null) => void;
  closeAllCards: () => void;
  isCardOpen: (id: string) => boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  openCardId: null,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Swipe State Store (Ephemeral - Not Persisted)
 *
 * Core Principles:
 * - Global coordination: Only ONE card can be swiped open at a time
 * - Auto-close previous: Opening a new card automatically closes the previous one
 * - Ephemeral state: Swipe state is not persisted across page refreshes
 * - Performance: Uses shallow selectors to minimize re-renders
 */
export const useSwipeStateStore = create<SwipeStateStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Set the currently open card
       * If a different card is already open, it will be automatically closed
       * @param id - Card ID to open, or null to close all
       */
      setOpenCard: (id) => {
        set(
          { openCardId: id },
          false,
          'swipe-state/setOpenCard'
        );
      },

      /**
       * Close all open cards
       */
      closeAllCards: () => {
        set(
          { openCardId: null },
          false,
          'swipe-state/closeAllCards'
        );
      },

      /**
       * Check if a specific card is currently open
       * @param id - Card ID to check
       */
      isCardOpen: (id) => {
        return get().openCardId === id;
      },
    }),
    { name: 'SwipeState' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get the currently open card ID
 * Cached selector to prevent SSR hydration issues
 */
export const useOpenCardId = () =>
  useSwipeStateStore((state) => state.openCardId);

/**
 * Check if a specific card is open
 * Uses shallow comparison to prevent unnecessary re-renders
 * Cached to prevent SSR infinite loop warnings
 * @param id - Card ID to check
 */
export const useIsCardOpen = (id: string) =>
  useSwipeStateStore((state) => state.openCardId === id);

/**
 * Get swipe state actions
 * Memoized selector to prevent unnecessary re-renders when only using actions
 * Returns stable reference to action functions
 */
export const useSetOpenCard = () =>
  useSwipeStateStore((state) => state.setOpenCard);

export const useCloseAllCards = () =>
  useSwipeStateStore((state) => state.closeAllCards);
