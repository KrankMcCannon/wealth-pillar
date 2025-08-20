import React, { memo } from "react";
import { ModalActions, FormField, Input, CheckboxGroup } from "../ui";
import { StepHeader } from './StepHeader';
import type { OnboardingBudget, OnboardingPerson } from "../../types";
import { useOnboarding } from "../../hooks";

interface OnboardingBudgetsStepProps {
  people: OnboardingPerson[];
  onNext: (budgets: OnboardingBudget[]) => void;
  onBack: () => void;
  onComplete: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 4: Creazione dei budget per ogni persona
 */
export const OnboardingBudgetsStep = memo<OnboardingBudgetsStepProps>(({ onNext, onBack, onComplete, isLoading, error }) => {
  const { state, budgetForm, budgetPeopleOptions, handlePersonToggleForBudget, saveBudgetForm } = useOnboarding();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onNext(state.budgets as OnboardingBudget[]);
    await onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepHeader title="Imposta i budget mensili" subtitle="Crea budget per tracciare le spese." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField id="b_name" label="Descrizione" error={budgetForm.errors.description} required>
          <Input value={budgetForm.data.name} onChange={(e) => budgetForm.updateField('name', e.target.value)} disabled={isLoading} />
        </FormField>
        <FormField id="b_amount" label="Importo (€)" error={budgetForm.errors.amount} required>
          <Input type="number" value={budgetForm.data.amount} onChange={(e) => budgetForm.updateField('amount', Number(e.target.value))} disabled={isLoading} />
        </FormField>
        <FormField id="b_category" label="Categoria" error={budgetForm.errors.selectedCategories || budgetForm.errors.category} required>
          <Input value={budgetForm.data.category} onChange={(e) => budgetForm.updateField('category', e.target.value)} disabled={isLoading} />
        </FormField>
      </div>
      <FormField id="b_people" label="Persona" error={budgetForm.errors.selectedPersonIds} required>
        <CheckboxGroup options={budgetPeopleOptions} onChange={handlePersonToggleForBudget} columns={2} />
      </FormField>
      <div className="flex space-x-2">
        <button type="button" onClick={() => saveBudgetForm()} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:bg-blue-400" disabled={isLoading}>Aggiungi Budget</button>
        <button type="button" onClick={() => budgetForm.resetForm()} className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg">Reset</button>
      </div>

      <ModalActions onCancel={onBack} onSubmit={handleSubmit} submitText={isLoading ? 'Completamento...' : 'Completa Configurazione'} cancelText="Indietro" isSubmitting={isLoading} />
      {error && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">{error}</div>
      )}
    </form>
  );
});

OnboardingBudgetsStep.displayName = "OnboardingBudgetsStep";
