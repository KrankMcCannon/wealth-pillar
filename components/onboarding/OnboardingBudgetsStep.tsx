import React, { memo } from "react";
import { FormField, Input, ModalActions } from "../ui";
import type { OnboardingBudget, OnboardingPerson } from "../../types";
import { useOnboardingBudgetsForm } from "../../hooks/features/onboarding/useOnboardingBudgetsForm";

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
export const OnboardingBudgetsStep = memo<OnboardingBudgetsStepProps>(
  ({ people, onNext, onBack, onComplete, isLoading, error }) => {
    const {
      budgetsByPerson,
      expenseCategories,
      validationErrors,
      updateBudget,
      handleCategoryToggle,
      validateForm,
      canSubmit,
      validBudgets,
    } = useOnboardingBudgetsForm(people);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;
      onNext(validBudgets);
      await onComplete();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrizione */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Imposta i budget mensili</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Crea un budget per ogni persona per tenere sotto controllo le spese.
          </p>
        </div>

        {/* Budget per ogni persona */}
        <div className="space-y-8">
          {budgetsByPerson.map(({ person, budgets: personBudgets }) => (
            <div key={person.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-6">
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
                    Imposta un budget mensile per controllare le spese
                  </p>
                </div>
              </div>

              {/* Budget per questa persona */}
              {personBudgets.map((budget) => (
                <div key={budget.index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Descrizione */}
                    <FormField
                      id={`budget_${budget.index}_description`}
                      label="Descrizione Budget"
                      error={validationErrors[`${person.name}_budget_${budget.index}_description`]}
                      required
                    >
                      <Input
                        type="text"
                        value={budget.description}
                        onChange={(e) => updateBudget(budget.index, "description", e.target.value)}
                        placeholder="es: Spese Casa, Svago, Trasporti..."
                        error={!!validationErrors[`${person.name}_budget_${budget.index}_description`]}
                        disabled={isLoading}
                      />
                    </FormField>

                    {/* Importo */}
                    <FormField
                      id={`budget_${budget.index}_amount`}
                      label="Importo Mensile (€)"
                      error={validationErrors[`${person.name}_budget_${budget.index}_amount`]}
                      required
                    >
                      <Input
                        type="number"
                        value={budget.amount}
                        onChange={(e) => updateBudget(budget.index, "amount", parseFloat(e.target.value) || 0)}
                        placeholder="500"
                        min="0"
                        step="10"
                        error={!!validationErrors[`${person.name}_budget_${budget.index}_amount`]}
                        disabled={isLoading}
                      />
                    </FormField>
                  </div>

                  {/* Categorie */}
                  <FormField
                    id={`budget_${budget.index}_categories`}
                    label="Categorie di Spesa"
                    error={validationErrors[`${person.name}_budget_${budget.index}_categories`]}
                    required
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {expenseCategories.map((category) => (
                        <label
                          key={category.name}
                          className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={budget.categories.includes(category.name)}
                            onChange={(e) => handleCategoryToggle(budget.index, category.name, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                            disabled={isLoading}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{category.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Seleziona le categorie di spesa da includere in questo budget
                    </p>
                  </FormField>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Errore generale */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Azioni */}
        <ModalActions
          onCancel={onBack}
          onSubmit={handleSubmit}
          submitText={isLoading ? "Completamento..." : "Completa Configurazione"}
          cancelText="Indietro"
          isSubmitting={isLoading}
          submitDisabled={!canSubmit}
        />
      </form>
    );
  }
);

OnboardingBudgetsStep.displayName = "OnboardingBudgetsStep";
