'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import type { Category } from '@/lib/types';
import type { OnboardingPayload } from '@/features/onboarding/types';
import { useOnboardingSubmission } from '@/features/auth/hooks/use-onboarding-submission';
import { onboardingStyles, getOnboardingProgressStyle } from '@/features/onboarding/styles';
import { OnboardingStepBudgets } from './step-budgets';
import { OnboardingStepGroup } from './step-group';
import { OnboardingStepNavigation } from './step-navigation';
import { OnboardingStepProfile } from './step-profile';
import { useOnboardingWizard } from './use-onboarding-wizard';

interface OnboardingWizardProps {
  categories: Category[];
}

function getStepDotClass(index: number, currentStep: number) {
  if (index === currentStep) return onboardingStyles.steps.dotActive;
  if (index < currentStep) return onboardingStyles.steps.dotDone;
  return onboardingStyles.steps.dotIdle;
}

export function OnboardingWizard({ categories }: Readonly<OnboardingWizardProps>) {
  const { submit } = useOnboardingSubmission();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = useCallback(
    async (payload: OnboardingPayload) => {
      setIsSubmitting(true);
      try {
        const result = await submit(payload);
        if (!result.ok) {
          throw new Error(result.error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [submit]
  );

  const wizard = useOnboardingWizard({ categories, onComplete: handleComplete });
  const {
    t,
    steps,
    currentStep,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    budgetStartDay,
    setBudgetStartDay,
    accounts,
    budgets,
    localError,
    canProceed,
    handleNext,
    handleBack,
    handleSubmit,
    accountTypeOptions,
    accountTypeDescriptions,
    budgetTypeOptions,
    categoryOptions,
    handleSkipBudgets,
    updateAccountField,
    setAccountAsDefault,
    addAccount,
    removeAccount,
    updateBudgetField,
    addBudget,
    removeBudget,
  } = wizard;

  const StepIcon = steps[currentStep]?.icon ?? HelpCircle;

  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return (
        <OnboardingStepGroup
          t={t}
          loading={isSubmitting}
          groupName={groupName}
          setGroupName={setGroupName}
          groupDescription={groupDescription}
          setGroupDescription={setGroupDescription}
        />
      );
    }
    if (currentStep === 1) {
      return (
        <OnboardingStepProfile
          t={t}
          loading={isSubmitting}
          accounts={accounts}
          accountTypeOptions={accountTypeOptions}
          accountTypeDescriptions={accountTypeDescriptions}
          updateAccountField={updateAccountField}
          setAccountAsDefault={setAccountAsDefault}
          addAccount={addAccount}
          removeAccount={removeAccount}
        />
      );
    }
    return (
      <OnboardingStepBudgets
        t={t}
        loading={isSubmitting}
        categories={categories}
        budgets={budgets}
        budgetStartDay={budgetStartDay}
        setBudgetStartDay={setBudgetStartDay}
        budgetTypeOptions={budgetTypeOptions}
        categoryOptions={categoryOptions}
        updateBudgetField={updateBudgetField}
        addBudget={addBudget}
        removeBudget={removeBudget}
        handleSkipBudgets={handleSkipBudgets}
      />
    );
  };

  return (
    <div className={onboardingStyles.container}>
      <header className={onboardingStyles.header.container}>
        <div className={onboardingStyles.header.content}>
          <div className={onboardingStyles.header.icon}>
            <StepIcon className={onboardingStyles.steps.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={onboardingStyles.steps.dots}>
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`${onboardingStyles.steps.dot} ${getStepDotClass(index, currentStep)}`}
                />
              ))}
            </div>
            <p className={onboardingStyles.header.meta}>
              {t('header.stepOf', { current: currentStep + 1, total: steps.length })}
            </p>
            <h2 className={onboardingStyles.header.title}>{steps[currentStep]?.title}</h2>
            <p className={onboardingStyles.header.description}>{steps[currentStep]?.description}</p>
          </div>
        </div>
        <div className={onboardingStyles.header.progressTrack}>
          <div
            className={onboardingStyles.header.progressIndicator}
            style={getOnboardingProgressStyle(currentStep, steps.length)}
          />
        </div>
      </header>

      <div className={onboardingStyles.stepContent}>{renderCurrentStep()}</div>

      {localError && (
        <div className={onboardingStyles.alert}>
          <AlertCircle className={onboardingStyles.footer.buttonIcon} />
          <span>{localError}</span>
        </div>
      )}

      <OnboardingStepNavigation
        t={t}
        steps={steps}
        currentStep={currentStep}
        loading={isSubmitting}
        canProceed={canProceed}
        handleBack={handleBack}
        handleNext={handleNext}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
