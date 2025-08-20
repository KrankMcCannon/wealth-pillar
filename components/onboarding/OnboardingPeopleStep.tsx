import React, { memo } from "react";
import { ModalActions } from "../ui";
import { StepHeader } from './StepHeader';
import type { OnboardingPerson } from "../../types";
import { useOnboarding } from "../../hooks";

interface OnboardingPeopleStepProps {
  onNext: (people: OnboardingPerson[]) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  groupName: string;
}

/**
 * Step 2: Aggiunta delle persone al gruppo
 */
export const OnboardingPeopleStep = memo<OnboardingPeopleStepProps>(
  ({ onNext, onBack, isLoading, error, groupName }) => {
    const { state, personForm, openPersonForm, savePersonForm, removePerson } = useOnboarding();
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onNext(state.people as OnboardingPerson[]);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <StepHeader
          title={`Aggiungi le persone a "${groupName}"`}
          subtitle="Aggiungi almeno una persona per gestire le finanze del gruppo."
        />

        {/* Inline simple person form */}
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
              <input
                type="text"
                value={personForm.data.name}
                onChange={(e) => personForm.updateField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="es: Mario Rossi"
                disabled={isLoading}
              />
              {personForm.errors.name && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{personForm.errors.name}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => { openPersonForm(); personForm.resetForm(); }}
              className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
              disabled={isLoading}
            >
              Nuova Persona
            </button>
            <button
              type="button"
              onClick={() => savePersonForm()}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:bg-blue-400"
              disabled={isLoading}
            >
              Aggiungi/Salva
            </button>
          </div>
        </div>

        {/* Lista persone */}
        <div className="space-y-2">
          {state.people.map((p, idx) => (
            <div key={p.id || idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-800 dark:text-gray-200">{p.name}</div>
              <div className="space-x-2">
                <button type="button" onClick={() => openPersonForm(idx)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">
                  Modifica
                </button>
                <button type="button" onClick={() => removePerson(idx)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                  Rimuovi
                </button>
              </div>
            </div>
          ))}
          {state.people.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Nessuna persona aggiunta</div>
          )}
        </div>

        

        {/* Errore generale */}
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Azioni */}
        <ModalActions
          onCancel={onBack}
          onSubmit={handleSubmit}
          submitText="Continua con i conti"
          cancelText="Indietro"
          isSubmitting={isLoading}
        />
      </form>
    );
  }
);

OnboardingPeopleStep.displayName = "OnboardingPeopleStep";
