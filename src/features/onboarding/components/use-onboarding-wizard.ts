'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Building2, Target, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category, BudgetType } from '@/lib/types';
import type { OnboardingPayload } from '@/features/onboarding/types';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  flushDraft,
  type OnboardingDraftShape,
  type OnboardingDraftAccount,
  type OnboardingDraftBudget,
  type OnboardingDraftPersisted,
} from '@/features/onboarding/onboarding-draft-storage';
import { toast } from '@/hooks/use-toast';

function createInitialWizardState(): OnboardingDraftShape {
  return {
    currentStep: 0,
    groupName: '',
    groupDescription: '',
    budgetStartDay: 1,
    accounts: [{ id: crypto.randomUUID(), name: '', type: 'payroll', isDefault: true }],
    budgets: [
      { id: crypto.randomUUID(), description: '', amount: '', type: 'monthly', categoryId: '' },
    ],
  };
}

export type UseOnboardingWizardOptions = {
  userId: string | null;
  categories: Category[];
  onComplete: (data: OnboardingPayload) => Promise<void>;
};

export function useOnboardingWizard({
  userId,
  categories,
  onComplete,
}: UseOnboardingWizardOptions) {
  const t = useTranslations('OnboardingModal');
  const initial = useMemo(() => createInitialWizardState(), []);

  const [currentStep, setCurrentStep] = useState(initial.currentStep);
  const [groupName, setGroupName] = useState(initial.groupName);
  const [groupDescription, setGroupDescription] = useState(initial.groupDescription);
  const [budgetStartDay, setBudgetStartDay] = useState<number>(initial.budgetStartDay);
  const [accounts, setAccounts] = useState<OnboardingDraftAccount[]>(initial.accounts);
  const [budgets, setBudgets] = useState<OnboardingDraftBudget[]>(initial.budgets);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  const draftRef = useRef<OnboardingDraftShape | null>(null);
  const showDraftRestoreRef = useRef(false);
  useEffect(() => {
    showDraftRestoreRef.current = showDraftRestore;
  }, [showDraftRestore]);

  const applyDraftShape = useCallback((draft: OnboardingDraftShape | OnboardingDraftPersisted) => {
    const shape: OnboardingDraftShape =
      'v' in draft
        ? {
            currentStep: draft.currentStep,
            groupName: draft.groupName,
            groupDescription: draft.groupDescription,
            budgetStartDay: draft.budgetStartDay,
            accounts: draft.accounts,
            budgets: draft.budgets,
          }
        : draft;
    setCurrentStep(Math.min(Math.max(shape.currentStep, 0), 2));
    setGroupName(shape.groupName);
    setGroupDescription(shape.groupDescription);
    setBudgetStartDay(shape.budgetStartDay);
    setAccounts(
      shape.accounts.length > 0
        ? shape.accounts
        : [{ id: crypto.randomUUID(), name: '', type: 'payroll', isDefault: true }]
    );
    setBudgets(
      shape.budgets.length > 0
        ? shape.budgets
        : shape.currentStep === 2
          ? []
          : [
              {
                id: crypto.randomUUID(),
                description: '',
                amount: '',
                type: 'monthly',
                categoryId: '',
              },
            ]
    );
  }, []);

  const resetWizardState = useCallback(() => {
    const next = createInitialWizardState();
    applyDraftShape(next);
    setLocalError(null);
  }, [applyDraftShape]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!userId) {
        setShowDraftRestore(false);
        return;
      }
      setShowDraftRestore(Boolean(loadDraft(userId)));
    }, 0);
    return () => clearTimeout(id);
  }, [userId]);

  useEffect(() => {
    draftRef.current = {
      currentStep,
      groupName,
      groupDescription,
      budgetStartDay,
      accounts,
      budgets,
    };
  }, [currentStep, groupName, groupDescription, budgetStartDay, accounts, budgets]);

  useEffect(() => {
    if (!userId) return;

    const flush = () => {
      if (showDraftRestoreRef.current) return;
      const d = draftRef.current;
      if (d) flushDraft(userId, d);
    };

    window.addEventListener('pagehide', flush);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const timeout = setTimeout(() => {
      if (showDraftRestoreRef.current) return;
      saveDraft(userId, {
        currentStep,
        groupName,
        groupDescription,
        budgetStartDay,
        accounts,
        budgets,
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [userId, currentStep, groupName, groupDescription, budgetStartDay, accounts, budgets]);

  const steps = useMemo(
    () => [
      {
        id: 'group',
        title: t('steps.group.title'),
        description: t('steps.group.description'),
        icon: Building2,
      },
      {
        id: 'accounts',
        title: t('steps.accounts.title'),
        description: t('steps.accounts.description'),
        icon: Wallet,
      },
      {
        id: 'budgets',
        title: t('steps.budgets.title'),
        description: t('steps.budgets.description'),
        icon: Target,
      },
    ],
    [t]
  );

  const accountTypeOptions = useMemo(
    () =>
      (['payroll', 'savings', 'cash', 'investments'] as const).map((value) => ({
        value,
        label: t(`accountTypes.${value}.label`),
      })),
    [t]
  );

  const accountTypeDescriptions = useMemo(
    () => ({
      payroll: t('accountTypes.payroll.description'),
      savings: t('accountTypes.savings.description'),
      cash: t('accountTypes.cash.description'),
      investments: t('accountTypes.investments.description'),
    }),
    [t]
  );

  const budgetTypeOptions: { value: BudgetType; label: string }[] = useMemo(
    () => [
      { value: 'monthly', label: t('budgetTypes.monthly') },
      { value: 'annually', label: t('budgetTypes.annually') },
    ],
    [t]
  );

  const fallbackCategoryOptions = useMemo(
    () => [
      { value: 'expense', label: t('fallbackCategories.expense') },
      { value: 'utilities', label: t('fallbackCategories.utilities') },
      { value: 'other', label: t('fallbackCategories.other') },
    ],
    [t]
  );

  const restoreDraft = useCallback(() => {
    if (!userId) return;
    const draft = loadDraft(userId);
    if (!draft) {
      setShowDraftRestore(false);
      return;
    }
    applyDraftShape(draft);
    setShowDraftRestore(false);
    toast({
      title: t('draft.toastRestoredTitle'),
      description: t('draft.toastRestoredDescription'),
    });
  }, [userId, applyDraftShape, t]);

  const dismissDraftRestore = useCallback(() => {
    if (userId) clearDraft(userId);
    resetWizardState();
    setShowDraftRestore(false);
    toast({
      title: t('draft.toastDismissedTitle'),
      description: t('draft.toastDismissedDescription'),
    });
  }, [userId, resetWizardState, t]);

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return groupName.trim().length > 1;
    }

    if (currentStep === 1) {
      return accounts.every((account) => account.name.trim() && account.type);
    }

    if (currentStep === 2) {
      return budgets.every((budget) => {
        const amount = Number.parseFloat(budget.amount);
        return (
          budget.description.trim().length > 1 &&
          !Number.isNaN(amount) &&
          amount > 0 &&
          Boolean(budget.categoryId)
        );
      });
    }

    return true;
  }, [currentStep, groupName, accounts, budgets]);

  const categoryOptions = categories.length
    ? categories.map((category) => ({ value: category.id, label: category.label }))
    : fallbackCategoryOptions;

  const handleNext = useCallback(() => {
    if (!canProceed) {
      setLocalError(t('errors.completeRequiredFields'));
      return;
    }
    setLocalError(null);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [canProceed, steps.length, t]);

  const handleBack = useCallback(() => {
    setLocalError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const buildOnboardingPayload = useCallback(
    (options?: { emptyBudgets?: boolean }): OnboardingPayload => ({
      group: {
        name: groupName.trim(),
        description: groupDescription.trim(),
      },
      accounts: accounts.map((account) => ({
        name: account.name.trim(),
        type: account.type,
        isDefault: account.isDefault || false,
      })),
      budgets: options?.emptyBudgets
        ? []
        : budgets.map((budget) => ({
            description: budget.description.trim(),
            amount: Number.parseFloat(budget.amount),
            type: budget.type,
            categories: [budget.categoryId],
          })),
      budgetStartDay,
    }),
    [groupName, groupDescription, accounts, budgets, budgetStartDay]
  );

  const handleSubmit = useCallback(async () => {
    if (!canProceed) {
      setLocalError(t('errors.verifyRequiredFields'));
      return;
    }

    try {
      await onComplete(buildOnboardingPayload());

      if (userId) clearDraft(userId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('errors.saveFailed'));
    }
  }, [canProceed, onComplete, buildOnboardingPayload, userId, t]);

  const handleSkipBudgets = useCallback(async () => {
    setLocalError(null);
    try {
      await onComplete(buildOnboardingPayload({ emptyBudgets: true }));

      if (userId) clearDraft(userId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('errors.saveFailed'));
    }
  }, [onComplete, buildOnboardingPayload, userId, t]);

  const updateAccountField = useCallback(
    (index: number, field: keyof OnboardingDraftAccount, value: string) => {
      setAccounts((prev) =>
        prev.map((account, idx) => (idx === index ? { ...account, [field]: value } : account))
      );
    },
    []
  );

  const setAccountAsDefault = useCallback((index: number) => {
    setAccounts((prev) =>
      prev.map((account, idx) => ({
        ...account,
        isDefault: idx === index,
      }))
    );
  }, []);

  const addAccount = useCallback(() => {
    setAccounts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', type: 'payroll', isDefault: false },
    ]);
  }, []);

  const removeAccount = useCallback((index: number) => {
    setAccounts((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      const removed = prev[index];
      const firstUpdated = updated[0];
      if (removed?.isDefault && updated.length > 0 && firstUpdated) {
        firstUpdated.isDefault = true;
      }
      return updated;
    });
  }, []);

  const updateBudgetField = useCallback(
    (index: number, field: keyof OnboardingDraftBudget, value: string) => {
      setBudgets((prev) =>
        prev.map((budget, idx) => (idx === index ? { ...budget, [field]: value } : budget))
      );
    },
    []
  );

  const addBudget = useCallback(() => {
    setBudgets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', amount: '', type: 'monthly', categoryId: '' },
    ]);
  }, []);

  const removeBudget = useCallback((index: number) => {
    setBudgets((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  return {
    t,
    steps,
    currentStep,
    accountTypeOptions,
    accountTypeDescriptions,
    budgetTypeOptions,
    categoryOptions,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    budgetStartDay,
    setBudgetStartDay,
    accounts,
    budgets,
    localError,
    showDraftRestore,
    canProceed,
    restoreDraft,
    dismissDraftRestore,
    handleNext,
    handleBack,
    handleSubmit,
    handleSkipBudgets,
    updateAccountField,
    setAccountAsDefault,
    addAccount,
    removeAccount,
    updateBudgetField,
    addBudget,
    removeBudget,
  };
}

export type OnboardingWizardApi = ReturnType<typeof useOnboardingWizard>;
