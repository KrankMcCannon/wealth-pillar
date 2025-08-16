import React, { memo } from 'react';
import { FormField, Input, ModalActions } from '../ui';
import { OnboardingGroup } from '../../hooks/features/onboarding/useOnboarding';
import { useOnboardingGroupForm } from '../../hooks/features/onboarding/useOnboardingGroupForm';

interface OnboardingGroupStepProps {
  onNext: (group: OnboardingGroup) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 1: Creazione del gruppo
 */
export const OnboardingGroupStep = memo<OnboardingGroupStepProps>(({ onNext, isLoading, error }) => {
  const { groupData, validationErrors, handleFieldChange, validateForm, canSubmit } = useOnboardingGroupForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onNext({ name: groupData.name.trim(), description: groupData.description?.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Descrizione */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Crea il tuo primo gruppo
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Un gruppo ti permette di organizzare le finanze con la tua famiglia o i tuoi compagni di casa.
        </p>
      </div>

      {/* Nome del gruppo */}
      <FormField
        id="group_name"
        label="Nome del gruppo"
        error={validationErrors.name}
        required
      >
        <Input
          type="text"
          value={groupData.name}
          onChange={handleFieldChange('name')}
          placeholder="es: Famiglia Rossi, Casa degli studenti..."
          error={!!validationErrors.name}
          disabled={isLoading}
          autoFocus
        />
      </FormField>

      {/* Descrizione (opzionale) */}
      <FormField
        id="group_description"
        label="Descrizione (opzionale)"
        error={validationErrors.description}
      >
        <Input
          type="text"
          value={groupData.description || ''}
          onChange={handleFieldChange('description')}
          placeholder="es: Gestione delle spese familiari..."
          error={!!validationErrors.description}
          disabled={isLoading}
        />
      </FormField>

      {/* Errore generale */}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Azioni */}
      <ModalActions
        onCancel={() => {}}
        onSubmit={handleSubmit}
        submitText="Crea gruppo e continua"
        isSubmitting={isLoading}
        submitDisabled={!canSubmit}
        showCancel={false}
      />
    </form>
  );
});

OnboardingGroupStep.displayName = 'OnboardingGroupStep';
