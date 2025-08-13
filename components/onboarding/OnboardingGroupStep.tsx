import React, { memo, useCallback, useState } from 'react';
import { FormField, Input, ModalActions } from '../ui';
import { OnboardingGroup } from '../../hooks/features/onboarding/useOnboarding';

interface OnboardingGroupStepProps {
  onNext: (group: OnboardingGroup) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 1: Creazione del gruppo
 * Principio SRP: Single Responsibility - gestisce solo la creazione del gruppo
 */
export const OnboardingGroupStep = memo<OnboardingGroupStepProps>(({ 
  onNext, 
  isLoading, 
  error 
}) => {
  const [groupData, setGroupData] = useState<OnboardingGroup>({
    name: '',
    description: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validazione del form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!groupData.name.trim()) {
      errors.name = 'Il nome del gruppo è obbligatorio';
    } else if (groupData.name.trim().length < 2) {
      errors.name = 'Il nome deve contenere almeno 2 caratteri';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [groupData]);

  /**
   * Gestisce l'invio del form
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onNext({
      name: groupData.name.trim(),
      description: groupData.description?.trim() || undefined,
    });
  }, [groupData, validateForm, onNext]);

  /**
   * Gestisce i cambiamenti nei campi
   */
  const handleFieldChange = useCallback((field: keyof OnboardingGroup) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGroupData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));
      
      // Pulisce l'errore quando l'utente inizia a digitare
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  , [validationErrors]);

  /**
   * Controlla se il form può essere inviato
   */
  const canSubmit = groupData.name.trim().length > 0;

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
        onCancel={() => {}} // Non mostriamo il pulsante cancel nel primo step
        onSubmit={handleSubmit}
        submitLabel="Crea gruppo e continua"
        isSubmitting={isLoading}
        disabled={!canSubmit}
        showCancel={false} // Nascondiamo il pulsante cancel
      />
    </form>
  );
});

OnboardingGroupStep.displayName = 'OnboardingGroupStep';
