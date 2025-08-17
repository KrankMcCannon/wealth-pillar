import React, { memo } from "react";
import { FormField, Input, ModalActions } from "../ui";
import { PlusIcon, TrashIcon } from "../common/Icons";
import type { OnboardingAccount, OnboardingPerson } from "../../types";
import { useOnboardingAccountsForm } from "../../hooks/features/onboarding/useOnboardingAccountsForm";

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
export const OnboardingAccountsStep = memo<OnboardingAccountsStepProps>(
  ({ people, onNext, onBack, isLoading, error }) => {
    const {
      accountsByPerson,
      accountTypes,
      validationErrors,
      addAccount,
      removeAccount,
      updateAccount,
      validateForm,
      canSubmit,
      validAccounts,
    } = useOnboardingAccountsForm(people);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;
      onNext(validAccounts);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrizione */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Crea i conti per ogni persona</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Ogni persona deve avere almeno un conto. Puoi aggiungerne altri in seguito.
          </p>
        </div>

        {/* Account per ogni persona */}
        <div className="space-y-8">
          {accountsByPerson.map(({ person, accounts: personAccounts }) => (
            <div key={person.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                  style={{ backgroundColor: person.themeColor }}
                >
                  {person.avatar || person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {person.name}
                    {people.length === 1 && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(persona selezionata)</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {personAccounts.length} {personAccounts.length === 1 ? "conto" : "conti"}
                  </p>
                </div>
              </div>

              {/* Errore per persona senza account */}
              {validationErrors[`person_${person.name}_accounts`] && (
                <div className="text-red-600 dark:text-red-400 text-sm mb-4">
                  {validationErrors[`person_${person.name}_accounts`]}
                </div>
              )}

              {/* Errore per account duplicati */}
              {validationErrors[`person_${person.name}_duplicates`] && (
                <div className="text-red-600 dark:text-red-400 text-sm mb-4">
                  {validationErrors[`person_${person.name}_duplicates`]}
                </div>
              )}

              {/* Lista account per questa persona */}
              <div className="space-y-4">
                {personAccounts.map((account) => (
                  <div key={account.index} className="flex items-end gap-4">
                    <div className="flex-1">
                      <FormField
                        id={`account_${person.name}_${account.index}_name`}
                        label="Nome del conto"
                        error={validationErrors[`account_${person.name}_${account.index}_name`]}
                        required
                      >
                        <Input
                          type="text"
                          value={account.name}
                          onChange={(e) => updateAccount(account.index, "name", e.target.value)}
                          placeholder="es: Conto corrente, Risparmi..."
                          error={!!validationErrors[`account_${person.name}_${account.index}_name`]}
                          disabled={isLoading}
                        />
                      </FormField>
                    </div>

                    <div className="flex-1">
                      <FormField id={`account_${person.name}_${account.index}_type`} label="Tipo di conto" required>
                        <select
                          value={account.type}
                          onChange={(e) => updateAccount(account.index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          disabled={isLoading}
                        >
                          {accountTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    {/* Pulsante rimuovi (solo se ha più di un account) */}
                    {personAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(account.index)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mb-1"
                        disabled={isLoading}
                        title="Rimuovi account"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Pulsante aggiungi account */}
                <button
                  type="button"
                  onClick={() => addAccount(person.name)}
                  className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  disabled={isLoading}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Aggiungi altro conto
                </button>
              </div>
            </div>
          ))}
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
          submitText="Continua con i budget"
          isSubmitting={isLoading}
          submitDisabled={!canSubmit}
          cancelText="Indietro"
        />
      </form>
    );
  }
);

OnboardingAccountsStep.displayName = "OnboardingAccountsStep";
