import React, { memo, useCallback, useState, useMemo } from 'react';
import { FormField, Input, ModalActions } from '../ui';
import { PlusIcon, TrashIcon } from '../common/Icons';
import { OnboardingAccount, OnboardingPerson } from '../../hooks/features/onboarding/useOnboarding';

interface OnboardingAccountsStepProps {
  people: OnboardingPerson[];
  onNext: (accounts: OnboardingAccount[]) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Step 3: Creazione degli account per ogni persona
 * Principio SRP: Single Responsibility - gestisce solo la creazione degli account
 */
export const OnboardingAccountsStep = memo<OnboardingAccountsStepProps>(({ 
  people, 
  onNext, 
  onBack, 
  isLoading, 
  error 
}) => {
  // Inizializza un account per ogni persona
  const [accounts, setAccounts] = useState<OnboardingAccount[]>(
    people.map(person => ({
      name: '',
      type: 'stipendio' as const,
      personId: person.name, // Usa il nome come ID temporaneo
    }))
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Tipi di account disponibili
   */
  const accountTypes = [
    { value: 'stipendio', label: 'Stipendio' },
    { value: 'risparmio', label: 'Risparmio' },
    { value: 'contanti', label: 'Contanti' },
    { value: 'investimenti', label: 'Investimenti' },
  ] as const;

  /**
   * Validazione del form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Controlla che ogni persona abbia almeno un account
    people.forEach((person) => {
      const personAccounts = accounts.filter(acc => acc.personId === person.name);
      if (personAccounts.length === 0) {
        errors[`person_${person.name}_accounts`] = `${person.name} deve avere almeno un account`;
        return;
      }

      // Controlla che tutti gli account abbiano un nome
      personAccounts.forEach((account, index) => {
        if (!account.name.trim()) {
          errors[`account_${person.name}_${index}_name`] = 'Il nome del conto è obbligatorio';
        }
      });

      // Controlla che non ci siano nomi duplicati per la stessa persona
      const accountNames = personAccounts.map(acc => acc.name.trim().toLowerCase());
      const duplicates = accountNames.filter((name, index) => 
        name && accountNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        errors[`person_${person.name}_duplicates`] = `${person.name} ha account con nomi duplicati`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [people, accounts]);

  /**
   * Gestisce l'invio del form
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const validAccounts = accounts
      .filter(account => account.name.trim().length > 0)
      .map(account => ({
        ...account,
        name: account.name.trim(),
      }));

    onNext(validAccounts);
  }, [accounts, validateForm, onNext]);

  /**
   * Aggiunge un nuovo account per una persona
   */
  const addAccount = useCallback((personName: string) => {
    setAccounts(prev => [
      ...prev,
      {
        name: '',
        type: 'stipendio' as const,
        personId: personName,
      }
    ]);
  }, []);

  /**
   * Rimuove un account
   */
  const removeAccount = useCallback((accountIndex: number) => {
    setAccounts(prev => prev.filter((_, index) => index !== accountIndex));
  }, []);

  /**
   * Aggiorna i dati di un account
   */
  const updateAccount = useCallback((accountIndex: number, field: keyof OnboardingAccount, value: string) => {
    setAccounts(prev => prev.map((account, index) => 
      index === accountIndex 
        ? { ...account, [field]: value }
        : account
    ));

    // Pulisce l'errore quando l'utente inizia a digitare
    const errorKey = `account_${accounts[accountIndex]?.personId}_${accountIndex}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [accounts, validationErrors]);

  /**
   * Raggruppa gli account per persona
   */
  const accountsByPerson = useMemo(() => {
    return people.map(person => ({
      person,
      accounts: accounts
        .map((account, index) => ({ ...account, index }))
        .filter(account => account.personId === person.name),
    }));
  }, [people, accounts]);

  /**
   * Controlla se il form può essere inviato
   */
  const canSubmit = useMemo(() => {
    return people.every(person => {
      const personAccounts = accounts.filter(acc => acc.personId === person.name);
      return personAccounts.length > 0 && 
             personAccounts.every(acc => acc.name.trim().length > 0);
    });
  }, [people, accounts]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Descrizione */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Crea i conti per ogni persona
        </h3>
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
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      (persona selezionata)
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {personAccounts.length} {personAccounts.length === 1 ? 'conto' : 'conti'}
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
                      label="Nome del conto"
                      error={validationErrors[`account_${person.name}_${account.index}_name`]}
                      required
                    >
                      <Input
                        type="text"
                        value={account.name}
                        onChange={(e) => updateAccount(account.index, 'name', e.target.value)}
                        placeholder="es: Conto corrente, Risparmi..."
                        error={!!validationErrors[`account_${person.name}_${account.index}_name`]}
                        disabled={isLoading}
                      />
                    </FormField>
                  </div>

                  <div className="flex-1">
                    <FormField label="Tipo di conto" required>
                      <select
                        value={account.type}
                        onChange={(e) => updateAccount(account.index, 'type', e.target.value)}
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
        submitLabel="Continua con i budget"
        isSubmitting={isLoading}
        disabled={!canSubmit}
        cancelLabel="Indietro"
      />
    </form>
  );
});

OnboardingAccountsStep.displayName = 'OnboardingAccountsStep';
