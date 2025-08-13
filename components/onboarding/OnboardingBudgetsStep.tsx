import React, { memo, useCallback, useState, useMemo } from 'react';
import { FormField, Input, ModalActions } from '../ui';
import { OnboardingBudget, OnboardingPerson } from '../../hooks/features/onboarding/useOnboarding';
import { useFinance } from '../../hooks/core/useFinance';

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
 * Principio SRP: Single Responsibility - gestisce solo la creazione dei budget
 */
export const OnboardingBudgetsStep = memo<OnboardingBudgetsStepProps>(({ 
  people, 
  onNext, 
  onBack,
  onComplete,
  isLoading, 
  error 
}) => {
  const { categories } = useFinance();

  // Inizializza un budget per ogni persona
  const [budgets, setBudgets] = useState<OnboardingBudget[]>(
    people.map(person => ({
      description: `Budget mensile di ${person.name}`,
      amount: 1000, // Default amount
      categories: [], // Nessuna categoria selezionata inizialmente
      personId: person.name, // Usa il nome come ID temporaneo
    }))
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Filtra solo le categorie che non sono trasferimenti
  const expenseCategories = useMemo(() => 
    categories.filter(cat => 
      cat.name !== 'trasferimento' && cat.name !== 'transfer'
    ), [categories]);

  /**
   * Validazione del form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    budgets.forEach((budget, index) => {
      const person = people.find(p => p.name === budget.personId);
      if (!person) return;

      if (!budget.description.trim()) {
        errors[`budget_${index}_description`] = 'La descrizione del budget è obbligatoria';
      }

      if (budget.amount <= 0) {
        errors[`budget_${index}_amount`] = 'L\'importo deve essere maggiore di zero';
      }

      if (budget.categories.length === 0) {
        errors[`budget_${index}_categories`] = `${person.name} deve selezionare almeno una categoria`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [budgets, people]);

  /**
   * Gestisce l'invio del form
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const validBudgets = budgets.map(budget => ({
      ...budget,
      description: budget.description.trim(),
    }));

    onNext(validBudgets);
    await onComplete();
  }, [budgets, validateForm, onNext, onComplete]);

  /**
   * Aggiorna i dati di un budget
   */
  const updateBudget = useCallback((budgetIndex: number, field: keyof OnboardingBudget, value: any) => {
    setBudgets(prev => prev.map((budget, index) => 
      index === budgetIndex 
        ? { ...budget, [field]: value }
        : budget
    ));

    // Pulisce l'errore quando l'utente inizia a modificare
    const errorKey = `budget_${budgetIndex}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * Gestisce il toggle delle categorie
   */
  const handleCategoryToggle = useCallback((budgetIndex: number, categoryName: string, checked: boolean) => {
    const currentCategories = budgets[budgetIndex].categories;
    const newCategories = checked
      ? [...currentCategories, categoryName]
      : currentCategories.filter(cat => cat !== categoryName);
    
    updateBudget(budgetIndex, 'categories', newCategories);
  }, [budgets, updateBudget]);

  /**
   * Controlla se il form può essere inviato
   */
  const canSubmit = useMemo(() => {
    return budgets.every(budget => 
      budget.description.trim().length > 0 && 
      budget.amount > 0 &&
      budget.categories.length > 0
    );
  }, [budgets]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Descrizione */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Imposta i budget mensili
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Crea un budget per ogni persona per tenere sotto controllo le spese.
        </p>
      </div>

      {/* Budget per ogni persona */}
      <div className="space-y-8">
        {budgets.map((budget, budgetIndex) => {
          const person = people.find(p => p.name === budget.personId);
          if (!person) return null;

          return (
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
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        (persona selezionata)
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Budget mensile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Descrizione */}
                <FormField
                  label="Descrizione del budget"
                  error={validationErrors[`budget_${budgetIndex}_description`]}
                  required
                >
                  <Input
                    type="text"
                    value={budget.description}
                    onChange={(e) => updateBudget(budgetIndex, 'description', e.target.value)}
                    placeholder="es: Budget mensile di Maria"
                    error={!!validationErrors[`budget_${budgetIndex}_description`]}
                    disabled={isLoading}
                  />
                </FormField>

                {/* Importo */}
                <FormField
                  label="Importo mensile (€)"
                  error={validationErrors[`budget_${budgetIndex}_amount`]}
                  required
                >
                  <Input
                    type="number"
                    value={budget.amount.toString()}
                    onChange={(e) => updateBudget(budgetIndex, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="1000"
                    min="0"
                    step="50"
                    error={!!validationErrors[`budget_${budgetIndex}_amount`]}
                    disabled={isLoading}
                  />
                </FormField>
              </div>

              {/* Categorie */}
              <div className="mt-6">
                <FormField
                  label="Categorie incluse nel budget"
                  error={validationErrors[`budget_${budgetIndex}_categories`]}
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
                          onChange={(e) => handleCategoryToggle(budgetIndex, category.name, e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.label || category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Seleziona le categorie di spesa che vuoi includere in questo budget.
                  </p>
                </FormField>
              </div>

              {/* Riepilogo */}
              {budget.categories.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Budget configurato:</strong> €{budget.amount.toLocaleString()} al mese per{' '}
                    {budget.categories.length} {budget.categories.length === 1 ? 'categoria' : 'categorie'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota informativa */}
      {people.length === 1 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Suggerimento:</strong> Puoi sempre modificare o aggiungere nuovi budget dopo aver completato la configurazione iniziale.
          </p>
        </div>
      )}

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
        submitLabel="Completa configurazione"
        isSubmitting={isLoading}
        disabled={!canSubmit}
        cancelLabel="Indietro"
      />
    </form>
  );
});

OnboardingBudgetsStep.displayName = 'OnboardingBudgetsStep';
