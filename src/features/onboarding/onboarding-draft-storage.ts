import type { AccountType, BudgetType } from '@/lib/types';

export const ONBOARDING_DRAFT_VERSION = 1 as const;

/** Stato conto/budget allineato al wizard modale; usato per persistenza locale. */
export interface OnboardingDraftAccount {
  id: string;
  name: string;
  type: AccountType;
  isDefault?: boolean;
}

export interface OnboardingDraftBudget {
  id: string;
  description: string;
  amount: string;
  type: BudgetType;
  categoryId: string;
}

/** Bozza salvata in `localStorage` (solo questo dispositivo). */
export interface OnboardingDraftPersisted {
  v: typeof ONBOARDING_DRAFT_VERSION;
  currentStep: number;
  groupName: string;
  groupDescription: string;
  budgetStartDay: number;
  accounts: OnboardingDraftAccount[];
  budgets: OnboardingDraftBudget[];
}

/** Forma dati senza wrapper versione (wizard + persistenza). */
export type OnboardingDraftShape = Omit<OnboardingDraftPersisted, 'v'>;

function draftStorageKey(userId: string): string {
  return `wealth-pillar:onboarding-draft:v${ONBOARDING_DRAFT_VERSION}:${userId}`;
}

/**
 * True se c’è progresso rispetto allo stato iniziale vuoto del wizard
 * (evita banner “ripristina” dopo mount senza input).
 */
export function hasMeaningfulDraft(
  draft: OnboardingDraftShape | OnboardingDraftPersisted
): boolean {
  if (draft.currentStep > 0) return true;
  if (draft.groupName.trim().length > 0) return true;
  if (draft.groupDescription.trim().length > 0) return true;
  if (draft.budgetStartDay !== 1) return true;

  if (draft.accounts.length > 1) return true;
  if (draft.accounts.some((a) => a.name.trim().length > 0 || a.type !== 'payroll')) return true;

  if (draft.budgets.length === 0 && draft.currentStep >= 2) return true;
  if (draft.budgets.length > 1) return true;
  if (
    draft.budgets.some(
      (b) =>
        b.description.trim().length > 0 ||
        b.amount.trim().length > 0 ||
        b.categoryId.length > 0 ||
        b.type !== 'monthly'
    )
  ) {
    return true;
  }

  return false;
}

function parseDraft(raw: string | null): OnboardingDraftPersisted | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== ONBOARDING_DRAFT_VERSION) return null;
    if (
      typeof o.currentStep !== 'number' ||
      typeof o.groupName !== 'string' ||
      typeof o.groupDescription !== 'string' ||
      typeof o.budgetStartDay !== 'number' ||
      !Array.isArray(o.accounts) ||
      !Array.isArray(o.budgets)
    ) {
      return null;
    }
    return {
      v: ONBOARDING_DRAFT_VERSION,
      currentStep: o.currentStep,
      groupName: o.groupName,
      groupDescription: o.groupDescription,
      budgetStartDay: o.budgetStartDay,
      accounts: o.accounts as OnboardingDraftAccount[],
      budgets: o.budgets as OnboardingDraftBudget[],
    };
  } catch {
    return null;
  }
}

export function loadDraft(userId: string | null): OnboardingDraftPersisted | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const key = draftStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = parseDraft(raw);
    if (!draft) return null;
    if (!hasMeaningfulDraft(draft)) {
      localStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch (e) {
    console.error('[onboarding-draft] load failed:', e);
    return null;
  }
}

export function saveDraft(userId: string | null, draft: OnboardingDraftShape): void {
  if (!userId || typeof window === 'undefined') return;
  const payload: OnboardingDraftPersisted = { v: ONBOARDING_DRAFT_VERSION, ...draft };
  if (!hasMeaningfulDraft(payload)) {
    clearDraft(userId);
    return;
  }
  try {
    localStorage.setItem(draftStorageKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.error('[onboarding-draft] save failed:', e);
  }
}

export function clearDraft(userId: string | null): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(draftStorageKey(userId));
  } catch (e) {
    console.error('[onboarding-draft] clear failed:', e);
  }
}

/** Salvataggio immediato (chiusura tab / cambio scheda) per ridurre perdita entro il debounce. */
export function flushDraft(userId: string | null, draft: OnboardingDraftShape): void {
  saveDraft(userId, draft);
}
