import { memo } from "react";
import { useOnboarding, OnboardingStep } from "../../hooks";
import { BaseModal } from "../ui";
import {
  OnboardingGroupStep,
  OnboardingPeopleStep,
  OnboardingAccountsStep,
  OnboardingBudgetsStep,
  OnboardingCompletedStep,
} from "./";

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

/**
 * Progress bar component per l'onboarding
 */
const OnboardingProgress = memo<{ progress: number }>(({ progress }) => (
  <div className="mb-8">
    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
      <span>Progresso</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
));

OnboardingProgress.displayName = "OnboardingProgress";

/**
 * Componente principale per il flow di onboarding
 */
export const OnboardingFlow = memo<OnboardingFlowProps>(({ isOpen, onComplete }) => {
  const onboarding = useOnboarding();

  const getModalTitle = () => {
    switch (onboarding.currentStep) {
      case OnboardingStep.GROUP:
        return 'Configura il tuo gruppo';
      case OnboardingStep.PEOPLE:
        return 'Aggiungi le persone al gruppo';
      case OnboardingStep.ACCOUNTS:
        return 'Crea i conti';
      case OnboardingStep.BUDGETS:
        return 'Imposta i budget';
      case OnboardingStep.COMPLETION:
        return 'Configurazione completata!';
      default:
        return 'Configurazione iniziale';
    }
  };

  const isCompletion = onboarding.currentStep === OnboardingStep.COMPLETION;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}}
      title={getModalTitle()}
      maxWidth={onboarding.currentStep === OnboardingStep.ACCOUNTS || onboarding.currentStep === OnboardingStep.BUDGETS ? '2xl' : 'lg'}
      showCloseButton={false}
    >
      <div className="space-y-6">
        {!isCompletion && <OnboardingProgress progress={onboarding.progressPercentage} />} 

        {(() => {
          switch (onboarding.currentStep) {
            case OnboardingStep.GROUP:
              return (
                <OnboardingGroupStep
                  onNext={async () => { onboarding.handleGroupSubmit(); }}
                  isLoading={false}
                  error={null}
                />
              );
            case OnboardingStep.PEOPLE:
              return (
                <OnboardingPeopleStep
                  onNext={() => { const ok = onboarding.savePersonForm(); if (ok) onboarding.goToNextStep(); }}
                  onBack={onboarding.goToPreviousStep}
                  isLoading={false}
                  error={null}
                  groupName={onboarding.state.groupName}
                />
              );
            case OnboardingStep.ACCOUNTS:
              return (
                <OnboardingAccountsStep
                  people={onboarding.state.people as any}
                  onNext={() => { const ok = onboarding.saveAccountForm(); if (ok) onboarding.goToNextStep(); }}
                  onBack={onboarding.goToPreviousStep}
                  isLoading={false}
                  error={null}
                />
              );
            case OnboardingStep.BUDGETS:
              return (
                <OnboardingBudgetsStep
                  people={onboarding.state.people as any}
                  onNext={() => { const ok = onboarding.saveBudgetForm(); return ok; }}
                  onBack={onboarding.goToPreviousStep}
                  onComplete={async () => { await onboarding.completeOnboarding(); onComplete(); }}
                  isLoading={false}
                  error={null}
                />
              );
            case OnboardingStep.COMPLETION:
              return (
                <OnboardingCompletedStep onComplete={onComplete} />
              );
            default:
              return null;
          }
        })()}
      </div>
    </BaseModal>
  );
});

OnboardingFlow.displayName = "OnboardingFlow";
