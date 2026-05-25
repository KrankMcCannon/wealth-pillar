'use client';

import { AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import type { Category } from '@/lib/types';
import type { OnboardingPayload } from '@/features/onboarding/types';
import { onboardingStyles, getOnboardingProgressStyle } from '@/features/onboarding/styles';
import { OnboardingStepBudgets } from './step-budgets';
import { OnboardingStepGroup } from './step-group';
import { OnboardingStepNavigation } from './step-navigation';
import { OnboardingStepProfile } from './step-profile';
import { useOnboardingWizard } from './use-onboarding-wizard';

interface OnboardingModalProps {
  userId: string | null;
  categories: Category[];
  onComplete: (data: OnboardingPayload) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  categoriesLoading?: boolean;
}

function getStepDotClass(index: number, currentStep: number) {
  if (index === currentStep) return onboardingStyles.steps.dotActive;
  if (index < currentStep) return onboardingStyles.steps.dotDone;
  return onboardingStyles.steps.dotIdle;
}

export default function OnboardingModal({
  userId,
  categories,
  onComplete,
  loading = false,
  error = null,
  categoriesLoading = false,
}: Readonly<OnboardingModalProps>) {
  const wizard = useOnboardingWizard({ userId, categories, onComplete });
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
    showDraftRestore,
    canProceed,
    restoreDraft,
    dismissDraftRestore,
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
          loading={loading}
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
          loading={loading}
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
        loading={loading}
        categories={categories}
        categoriesLoading={categoriesLoading}
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
    <div className={onboardingStyles.overlay}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`${onboardingStyles.modal} relative`}
      >
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
              <p className={onboardingStyles.header.description}>
                {steps[currentStep]?.description}
              </p>
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

        {(localError || error) && (
          <div className={onboardingStyles.alert}>
            <AlertCircle className={onboardingStyles.footer.buttonIcon} />
            <span>{localError || error}</span>
          </div>
        )}

        <OnboardingStepNavigation
          t={t}
          steps={steps}
          currentStep={currentStep}
          loading={loading}
          categoriesLoading={categoriesLoading}
          canProceed={canProceed}
          handleBack={handleBack}
          handleNext={handleNext}
          handleSubmit={handleSubmit}
        />
      </motion.div>

      {showDraftRestore && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={onboardingStyles.draftRestore.container}
        >
          <div className={onboardingStyles.draftRestore.body}>
            <HelpCircle className={onboardingStyles.draftRestore.icon} />
            <div className={onboardingStyles.draftRestore.content}>
              <p className={onboardingStyles.draftRestore.title}>{t('draft.title')}</p>
              <p className={onboardingStyles.draftRestore.text}>{t('draft.description')}</p>
            </div>
          </div>
          <div className={onboardingStyles.draftRestore.actions}>
            <Button
              type="button"
              variant="default"
              onClick={restoreDraft}
              className="flex-1 sm:h-9"
            >
              {t('draft.restore')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={dismissDraftRestore}
              className="flex-1 sm:h-9"
            >
              {t('draft.restart')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
