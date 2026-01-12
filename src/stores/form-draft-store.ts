/**
 * Form Draft Store
 *
 * Auto-save form drafts to prevent data loss on accidental navigation.
 * Drafts persist in localStorage with optional TTL.
 *
 * @module stores/form-draft-store
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// ============================================================================
// Types
// ============================================================================

interface FormDraft {
  data: unknown;
  timestamp: number;
}

interface FormDraftStore {
  // Drafts (keyed by form ID)
  drafts: Record<string, FormDraft>;

  // Actions
  saveDraft: (formId: string, data: unknown) => void;
  getDraft: (formId: string) => unknown | null;
  clearDraft: (formId: string) => void;
  clearAllDrafts: () => void;
  clearExpiredDrafts: () => void;
}

// ============================================================================
// Constants
// ============================================================================

// Draft expiration: 7 days in milliseconds
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Store
// ============================================================================

export const useFormDraftStore = create<FormDraftStore>()(
  devtools(
    persist(
      (set, get) => ({
        drafts: {},

        // Save draft
        saveDraft: (formId, data) => {
          set(
            (state) => ({
              drafts: {
                ...state.drafts,
                [formId]: {
                  data,
                  timestamp: Date.now(),
                },
              },
            }),
            false,
            'form-draft/saveDraft'
          );
        },

        // Get draft (returns null if expired or not found)
        getDraft: (formId) => {
          const draft = get().drafts[formId];
          if (!draft) return null;

          // Check if expired
          const now = Date.now();
          if (now - draft.timestamp > DRAFT_TTL) {
            // Auto-clear expired draft
            get().clearDraft(formId);
            return null;
          }

          return draft.data;
        },

        // Clear single draft
        clearDraft: (formId) => {
          set(
            (state) => {
              const remaining = { ...state.drafts };
              delete remaining[formId];
              return { drafts: remaining };
            },
            false,
            'form-draft/clearDraft'
          );
        },

        // Clear all drafts
        clearAllDrafts: () => {
          set({ drafts: {} }, false, 'form-draft/clearAllDrafts');
        },

        // Clear expired drafts
        clearExpiredDrafts: () => {
          set(
            (state) => {
              const now = Date.now();
              const validDrafts = Object.entries(state.drafts).reduce(
                (acc, [key, draft]) => {
                  if (now - draft.timestamp <= DRAFT_TTL) {
                    acc[key] = draft;
                  }
                  return acc;
                },
                {} as Record<string, FormDraft>
              );
              return { drafts: validDrafts };
            },
            false,
            'form-draft/clearExpiredDrafts'
          );
        },
      }),
      {
        name: 'wealth-pillar-form-drafts',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'FormDraft' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get form draft actions
 */
export const useFormDraftActions = () =>
  useFormDraftStore(
    (state) => ({
      saveDraft: state.saveDraft,
      getDraft: state.getDraft,
      clearDraft: state.clearDraft,
      clearAllDrafts: state.clearAllDrafts,
      clearExpiredDrafts: state.clearExpiredDrafts,
    }),
    shallow
  );

/**
 * Get specific form draft
 * @param formId - Form identifier
 */
export const useFormDraft = (formId: string) =>
  useFormDraftStore((state) => state.getDraft(formId));

/**
 * Check if draft exists for form
 * @param formId - Form identifier
 */
export const useHasFormDraft = (formId: string) =>
  useFormDraftStore((state) => !!state.drafts[formId]);
