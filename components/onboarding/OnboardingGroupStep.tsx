import React, { memo } from "react";
import { FormField, Input, ModalActions } from "../ui";
import { StepHeader } from './StepHeader';
import type { OnboardingGroup } from "../../types";
import { useOnboarding } from "../../hooks";

interface OnboardingGroupStepProps {
  onNext: (group: OnboardingGroup) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 1: Creazione del gruppo
 */
export const OnboardingGroupStep = memo<OnboardingGroupStepProps>(({ onNext, isLoading, error }) => {
  const { groupForm } = useOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext({ name: groupForm.data.name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepHeader
        title="Crea il tuo primo gruppo"
        subtitle="Un gruppo ti permette di organizzare le finanze con la tua famiglia o i tuoi compagni di casa."
      />

      {/* Nome del gruppo */}
        <FormField id="group_name" label="Nome del gruppo" error={groupForm.errors.name} required>
          <Input
            type="text"
            value={groupForm.data.name}
            onChange={(e) => groupForm.updateField('name', e.target.value)}
            placeholder="es: Famiglia Rossi, Casa degli studenti..."
            error={!!groupForm.errors.name}
            disabled={isLoading}
            autoFocus
          />
        </FormField>

      {/* Descrizione (opzionale) */}
      

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
        submitDisabled={!groupForm.isValid}
        showCancel={false}
      />
    </form>
  );
});

OnboardingGroupStep.displayName = "OnboardingGroupStep";
