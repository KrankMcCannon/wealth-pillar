import React, { memo } from "react";
import { FormField, Input, ModalActions, CheckboxGroup, Select } from "../ui";
import type { OnboardingAccount, OnboardingPerson } from "../../types";
import { useOnboarding } from "../../hooks";

interface OnboardingAccountsStepProps {
  people: OnboardingPerson[];
  onNext: (accounts: OnboardingAccount[]) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 3: Creazione degli account per ogni persona
 */
export const OnboardingAccountsStep = memo<OnboardingAccountsStepProps>(({ onNext, onBack, isLoading }) => {
  const { state, accountForm, availableAccountTypes, peopleOptions, saveAccountForm, removeAccount, handlePersonToggleForAccount } = useOnboarding();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(state.accounts as OnboardingAccount[]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="acc_name" label="Nome conto" error={accountForm.errors.name} required>
          <Input value={accountForm.data.name} onChange={(e) => accountForm.updateField('name', e.target.value)} error={!!accountForm.errors.name} disabled={isLoading} />
        </FormField>
        <FormField id="acc_type" label="Tipo" required>
          <Select value={accountForm.data.type} onChange={(e) => accountForm.updateField('type', e.target.value)} options={availableAccountTypes.map(t => ({ value: t.value, label: t.label }))} disabled={isLoading} />
        </FormField>
      </div>
      <FormField id="acc_people" label="Persone collegate" error={accountForm.errors.selectedPersonIds} required>
        <CheckboxGroup options={peopleOptions} onChange={handlePersonToggleForAccount} columns={2} />
      </FormField>
      <div className="flex space-x-2">
        <button type="button" onClick={() => saveAccountForm()} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:bg-blue-400" disabled={isLoading}>Aggiungi Conto</button>
        <button type="button" onClick={() => accountForm.resetForm()} className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg">Reset</button>
      </div>

      <div className="space-y-2">
        {state.accounts.map((a, idx) => (
          <div key={a.id || idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-800 dark:text-gray-200">{a.name} • {a.type}</div>
            <button type="button" onClick={() => removeAccount(idx)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Rimuovi</button>
          </div>
        ))}
        {state.accounts.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Nessun conto aggiunto</div>
        )}
      </div>

      <ModalActions onCancel={onBack} onSubmit={handleSubmit} submitText="Continua con i budget" isSubmitting={isLoading} />
    </form>
  );
});

OnboardingAccountsStep.displayName = "OnboardingAccountsStep";
