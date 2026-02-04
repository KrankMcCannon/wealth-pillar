/**
 * UI State Store
 *
 * Centralized state management for UI preferences (tabs, expanded sections, pending actions).
 * Persists UI state across page refreshes and navigation.
 *
 * @module stores/ui-state-store
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ============================================================================
// Types
// ============================================================================

interface UIStateStore {
  // Tab states (keyed by page)
  activeTabs: Record<string, string>;

  // Expanded sections (keyed by section ID)
  expandedSections: Record<string, boolean>;

  // Pending actions (for optimistic UI states)
  pendingActions: Record<string, boolean>;

  // Tab actions
  setActiveTab: (page: string, tab: string) => void;
  getActiveTab: (page: string, defaultTab: string) => string;

  // Section actions
  toggleSection: (sectionId: string) => void;
  setSectionExpanded: (sectionId: string, expanded: boolean) => void;
  isSectionExpanded: (sectionId: string) => boolean;

  // Pending action actions
  setPendingAction: (actionId: string, pending: boolean) => void;
  isPending: (actionId: string) => boolean;
  clearPendingActions: () => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  activeTabs: {},
  expandedSections: {},
  pendingActions: {},
};

// ============================================================================
// Store
// ============================================================================

export const useUIStateStore = create<UIStateStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Tab actions
        setActiveTab: (page, tab) => {
          set(
            (state) => ({
              activeTabs: { ...state.activeTabs, [page]: tab },
            }),
            false,
            'ui-state/setActiveTab'
          );
        },

        getActiveTab: (page, defaultTab) => {
          return get().activeTabs[page] || defaultTab;
        },

        // Section actions
        toggleSection: (sectionId) => {
          set(
            (state) => ({
              expandedSections: {
                ...state.expandedSections,
                [sectionId]: !state.expandedSections[sectionId],
              },
            }),
            false,
            'ui-state/toggleSection'
          );
        },

        setSectionExpanded: (sectionId, expanded) => {
          set(
            (state) => ({
              expandedSections: { ...state.expandedSections, [sectionId]: expanded },
            }),
            false,
            'ui-state/setSectionExpanded'
          );
        },

        isSectionExpanded: (sectionId) => {
          return get().expandedSections[sectionId] || false;
        },

        // Pending action actions
        setPendingAction: (actionId, pending) => {
          set(
            (state) => {
              const newPendingActions = { ...state.pendingActions };
              if (pending) {
                newPendingActions[actionId] = true;
              } else {
                delete newPendingActions[actionId];
              }
              return { pendingActions: newPendingActions };
            },
            false,
            'ui-state/setPendingAction'
          );
        },

        isPending: (actionId) => {
          return get().pendingActions[actionId] || false;
        },

        clearPendingActions: () => {
          set({ pendingActions: {} }, false, 'ui-state/clearPendingActions');
        },

        // Reset
        reset: () => {
          set(initialState, false, 'ui-state/reset');
        },
      }),
      {
        name: 'wealth-pillar-ui-state',
        storage: createJSONStorage(() => localStorage),
        // Don't persist pending actions (ephemeral)
        partialize: (state) => ({
          activeTabs: state.activeTabs,
          expandedSections: state.expandedSections,
        }),
      }
    ),
    { name: 'UIState' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get active tab for a specific page
 * @param page - Page identifier
 * @param defaultTab - Default tab if none is set
 */
export const useActiveTab = (page: string, defaultTab: string) =>
  useUIStateStore((state) => state.activeTabs[page] || defaultTab);

/**
 * Get all active tabs
 */
export const useActiveTabs = () => useUIStateStore((state) => state.activeTabs);

/**
 * Check if section is expanded
 * @param sectionId - Section identifier
 */
export const useIsSectionExpanded = (sectionId: string) =>
  useUIStateStore((state) => state.expandedSections[sectionId] || false);

/**
 * Get all expanded sections
 */
export const useExpandedSections = () => useUIStateStore((state) => state.expandedSections);

/**
 * Check if action is pending
 * @param actionId - Action identifier
 */
export const useIsPending = (actionId: string) =>
  useUIStateStore((state) => state.pendingActions[actionId] || false);

/**
 * Get UI state actions
 */
export const useUIStateActions = () =>
  useUIStateStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      toggleSection: state.toggleSection,
      setSectionExpanded: state.setSectionExpanded,
      setPendingAction: state.setPendingAction,
      clearPendingActions: state.clearPendingActions,
      reset: state.reset,
    }))
  );
