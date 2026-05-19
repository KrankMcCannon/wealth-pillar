'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { onboardingStyles } from '@/features/onboarding/styles';
import type { OnboardingWizardApi } from './use-onboarding-wizard';

export type OnboardingStepNavigationProps = {
  t: OnboardingWizardApi['t'];
  steps: OnboardingWizardApi['steps'];
  currentStep: number;
  loading: boolean;
  categoriesLoading: boolean;
  canProceed: boolean;
  handleBack: OnboardingWizardApi['handleBack'];
  handleNext: OnboardingWizardApi['handleNext'];
  handleSubmit: OnboardingWizardApi['handleSubmit'];
};

export function OnboardingStepNavigation({
  t,
  steps,
  currentStep,
  loading,
  categoriesLoading,
  canProceed,
  handleBack,
  handleNext,
  handleSubmit,
}: Readonly<OnboardingStepNavigationProps>) {
  const renderButtonContent = () => {
    if (currentStep === steps.length - 1) {
      if (loading) {
        return (
          <>
            <Loader2 className={onboardingStyles.budgets.loadingIcon} />
            {t('buttons.saving')}
          </>
        );
      }
      return (
        <>
          {t('buttons.confirm')}
          <CheckCircle2 className={onboardingStyles.footer.buttonIcon} />
        </>
      );
    }
    return (
      <>
        {t('buttons.next')}
        <ArrowRight className={onboardingStyles.footer.buttonIcon} />
      </>
    );
  };

  return (
    <div className={onboardingStyles.footer.container}>
      {currentStep > 0 ? (
        <Button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className={onboardingStyles.backButton}
        >
          <ArrowLeft className={onboardingStyles.footer.buttonIcon} /> {t('buttons.back')}
        </Button>
      ) : (
        <div />
      )}

      <Button
        type="button"
        onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
        disabled={loading || !canProceed || (currentStep === steps.length - 1 && categoriesLoading)}
        className={onboardingStyles.nextButton}
      >
        {renderButtonContent()}
      </Button>
    </div>
  );
}
