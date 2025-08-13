import React, { memo } from 'react';
import { useOnboarding, OnboardingStep } from '../../hooks/features/onboarding/useOnboarding';
import { BaseModal } from '../ui';
import {
    OnboardingGroupStep,
    OnboardingPeopleStep,
    OnboardingAccountsStep,
    OnboardingBudgetsStep,
    OnboardingCompletedStep
} from './';

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

OnboardingProgress.displayName = 'OnboardingProgress';

/**
 * Componente principale per il flow di onboarding
 * Principio SRP: Single Responsibility - gestisce solo l'orchestrazione del flow
 * Principio OCP: Open/Closed - facilmente estendibile per nuovi step
 */
export const OnboardingFlow = memo<OnboardingFlowProps>(({ isOpen, onComplete }) => {
  const onboarding = useOnboarding();

  /**
   * Gestisce il completamento dell'onboarding
   */
  const handleComplete = () => {
    onboarding.resetOnboarding();
    onComplete();
  };

  /**
   * Renderizza lo step corrente
   */
  const renderCurrentStep = () => {
    switch (onboarding.currentStep) {
      case OnboardingStep.GROUP:
        return (
          <OnboardingGroupStep
            onNext={onboarding.saveGroup}
            isLoading={onboarding.isLoading}
            error={onboarding.error}
          />
        );

      case OnboardingStep.PEOPLE:
        return (
          <OnboardingPeopleStep
            onNext={onboarding.savePeople}
            onBack={onboarding.goToPreviousStep}
            isLoading={onboarding.isLoading}
            error={onboarding.error}
            groupName={onboarding.group?.name || ''}
          />
        );

      case OnboardingStep.ACCOUNTS:
        return (
          <OnboardingAccountsStep
            people={onboarding.people}
            onNext={onboarding.saveAccounts}
            onBack={onboarding.goToPreviousStep}
            isLoading={onboarding.isLoading}
            error={onboarding.error}
          />
        );

      case OnboardingStep.BUDGETS:
        return (
          <OnboardingBudgetsStep
            people={onboarding.people}
            onNext={onboarding.saveBudgets}
            onBack={onboarding.goToPreviousStep}
            onComplete={onboarding.completeOnboarding}
            isLoading={onboarding.isLoading}
            error={onboarding.error}
          />
        );

      case OnboardingStep.COMPLETED:
        return (
          <OnboardingCompletedStep
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  /**
   * Determina il titolo del modale in base allo step corrente
   */
  const getModalTitle = () => {
    switch (onboarding.currentStep) {
      case OnboardingStep.GROUP:
        return 'Benvenuto in Wealth Pillar!';
      case OnboardingStep.PEOPLE:
        return 'Aggiungi le persone al tuo gruppo';
      case OnboardingStep.ACCOUNTS:
        return 'Crea i conti per le persone';
      case OnboardingStep.BUDGETS:
        return 'Imposta i budget';
      case OnboardingStep.COMPLETED:
        return 'Configurazione completata!';
      default:
        return 'Configurazione iniziale';
    }
  };

  /**
   * Determina la larghezza massima del modale
   */
  const getModalMaxWidth = () => {
    switch (onboarding.currentStep) {
      case OnboardingStep.ACCOUNTS:
      case OnboardingStep.BUDGETS:
        return '4xl';
      default:
        return 'lg';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}} // Non permettiamo la chiusura durante l'onboarding
      title={getModalTitle()}
      maxWidth={getModalMaxWidth()}
      showCloseButton={false} // Nascondiamo il pulsante di chiusura
    >
      <div className="space-y-6">
        {/* Progress bar - nascondiamo solo per il step completato */}
        {onboarding.currentStep !== OnboardingStep.COMPLETED && (
          <OnboardingProgress progress={onboarding.progress} />
        )}

        {/* Step corrente */}
        {renderCurrentStep()}
      </div>
    </BaseModal>
  );
});

OnboardingFlow.displayName = 'OnboardingFlow';
