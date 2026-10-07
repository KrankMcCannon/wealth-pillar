'use client';

import { useMemo, useState, useCallback } from 'react';
import { Building2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OnboardingPayload, OnboardingFormAccount } from '@/features/onboarding/types';

function createInitialWizardState(): {
  currentStep: number;
  groupName: string;
  groupDescription: string;
  accounts: OnboardingFormAccount[];
} {
  return {
    currentStep: 0,
    groupName: '',
    groupDescription: '',
    accounts: [{ id: crypto.randomUUID(), name: '', type: 'payroll', isDefault: true }],
  };
}

export type UseOnboardingWizardOptions = {
  onComplete: (data: OnboardingPayload) => Promise<void>;
};

export function useOnboardingWizard({ onComplete }: UseOnboardingWizardOptions) {
  const t = useTranslations('OnboardingModal');
  const initial = useMemo(() => createInitialWizardState(), []);

  const [currentStep, setCurrentStep] = useState(initial.currentStep);
  const [groupName, setGroupName] = useState(initial.groupName);
  const [groupDescription, setGroupDescription] = useState(initial.groupDescription);
  const [accounts, setAccounts] = useState<OnboardingFormAccount[]>(initial.accounts);
  const [localError, setLocalError] = useState<string | null>(null);

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

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return groupName.trim().length > 1;
    }

    if (currentStep === 1) {
      return accounts.every((account) => account.name.trim() && account.type);
    }

    return true;
  }, [currentStep, groupName, accounts]);

  const handleNext = useCallback(() => {
    if (!canProceed) {
      setLocalError(t('errors.completeRequiredFields'));
      return;
    }
    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setLocalError(null);
    setCurrentStep(nextStep);
  }, [canProceed, currentStep, steps.length, t]);

  const handleBack = useCallback(() => {
    setLocalError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const buildOnboardingPayload = useCallback(
    (): OnboardingPayload => ({
      group: {
        name: groupName.trim(),
        description: groupDescription.trim(),
      },
      accounts: accounts.map((account) => ({
        name: account.name.trim(),
        type: account.type,
        isDefault: account.isDefault || false,
      })),
      budgets: [],
      budgetStartDay: 1,
    }),
    [groupName, groupDescription, accounts]
  );

  const handleSubmit = useCallback(async () => {
    if (!canProceed) {
      setLocalError(t('errors.verifyRequiredFields'));
      return;
    }

    try {
      await onComplete(buildOnboardingPayload());
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('errors.saveFailed'));
    }
  }, [canProceed, onComplete, buildOnboardingPayload, t]);

  const updateAccountField = useCallback(
    (index: number, field: keyof OnboardingFormAccount, value: string) => {
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

  return {
    t,
    steps,
    currentStep,
    accountTypeOptions,
    accountTypeDescriptions,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    accounts,
    localError,
    canProceed,
    handleNext,
    handleBack,
    handleSubmit,
    updateAccountField,
    setAccountAsDefault,
    addAccount,
    removeAccount,
    buildOnboardingPayload,
  };
}

export type OnboardingWizardApi = ReturnType<typeof useOnboardingWizard>;
