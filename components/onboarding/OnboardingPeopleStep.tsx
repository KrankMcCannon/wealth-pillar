import React, { memo, useCallback, useState } from 'react';
import { FormField, Input, ModalActions } from '../ui';
import { PlusIcon, TrashIcon } from '../common/Icons';
import { OnboardingPerson } from '../../hooks/features/onboarding/useOnboarding';

interface OnboardingPeopleStepProps {
  onNext: (people: OnboardingPerson[]) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  groupName: string;
}

/**
 * Step 2: Aggiunta delle persone al gruppo
 * Principio SRP: Single Responsibility - gestisce solo l'aggiunta delle persone
 */
export const OnboardingPeopleStep = memo<OnboardingPeopleStepProps>(({ 
  onNext, 
  onBack, 
  isLoading, 
  error,
  groupName 
}) => {
  const [people, setPeople] = useState<OnboardingPerson[]>([
    {
      name: '',
      avatar: '',
      themeColor: '#3b82f6', // Default blue
      budgetStartDate: '1', // Primo giorno del mese
    }
  ]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Colori predefiniti per le persone
   */
  const availableColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280', // Gray
  ];

  /**
   * Validazione del form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    people.forEach((person, index) => {
      if (!person.name.trim()) {
        errors[`person_${index}_name`] = 'Il nome è obbligatorio';
      } else if (person.name.trim().length < 2) {
        errors[`person_${index}_name`] = 'Il nome deve contenere almeno 2 caratteri';
      }

      // Controlla se ci sono nomi duplicati
      const duplicateIndex = people.findIndex((p, i) => 
        i !== index && p.name.trim() === person.name.trim() && person.name.trim() !== ''
      );
      if (duplicateIndex !== -1) {
        errors[`person_${index}_name`] = 'Questo nome è già stato utilizzato';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [people]);

  /**
   * Gestisce l'invio del form
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const validPeople = people
      .filter(person => person.name.trim().length > 0)
      .map(person => ({
        ...person,
        name: person.name.trim(),
      }));

    onNext(validPeople);
  }, [people, validateForm, onNext]);

  /**
   * Aggiunge una nuova persona
   */
  const addPerson = useCallback(() => {
    const newColorIndex = people.length % availableColors.length;
    setPeople(prev => [...prev, {
      name: '',
      avatar: '',
      themeColor: availableColors[newColorIndex],
      budgetStartDate: '1',
    }]);
  }, [people.length, availableColors]);

  /**
   * Rimuove una persona
   */
  const removePerson = useCallback((index: number) => {
    if (people.length > 1) {
      setPeople(prev => prev.filter((_, i) => i !== index));
      
      // Rimuove anche gli errori di validazione per quella persona
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`person_${index}_name`];
        return newErrors;
      });
    }
  }, [people.length]);

  /**
   * Gestisce i cambiamenti nei campi delle persone
   */
  const handlePersonChange = useCallback((index: number, field: keyof OnboardingPerson, value: string) => {
    setPeople(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
    
    // Pulisce l'errore quando l'utente inizia a digitare
    const errorKey = `person_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * Controlla se il form può essere inviato
   */
  const canSubmit = people.some(person => person.name.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Descrizione */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aggiungi le persone a "{groupName}"
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Aggiungi almeno una persona per gestire le finanze del gruppo.
        </p>
      </div>

      {/* Lista delle persone */}
      <div className="space-y-4">
        {people.map((person, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              {/* Colore tema */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                     style={{ backgroundColor: person.themeColor }}>
                  {person.name.charAt(0).toUpperCase() || '?'}
                </div>
              </div>

              {/* Campi della persona */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nome */}
                <FormField
                  label="Nome"
                  error={validationErrors[`person_${index}_name`]}
                  required
                >
                  <Input
                    type="text"
                    value={person.name}
                    onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                    placeholder="Nome persona"
                    error={!!validationErrors[`person_${index}_name`]}
                    disabled={isLoading}
                  />
                </FormField>

                {/* Colore tema */}
                <FormField label="Colore tema">
                  <select
                    value={person.themeColor}
                    onChange={(e) => handlePersonChange(index, 'themeColor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isLoading}
                  >
                    {availableColors.map((color, colorIndex) => (
                      <option key={color} value={color}>
                        Colore {colorIndex + 1}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Giorno inizio budget */}
                <FormField label="Giorno inizio budget mensile">
                  <select
                    value={person.budgetStartDate}
                    onChange={(e) => handlePersonChange(index, 'budgetStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isLoading}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Pulsante rimozione */}
              {people.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePerson(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  disabled={isLoading}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pulsante aggiungi persona */}
      <button
        type="button"
        onClick={addPerson}
        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <PlusIcon className="w-5 h-5" />
        Aggiungi un'altra persona
      </button>

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
        submitLabel="Continua con i conti"
        cancelLabel="Indietro"
        isSubmitting={isLoading}
        disabled={!canSubmit}
      />
    </form>
  );
});

OnboardingPeopleStep.displayName = 'OnboardingPeopleStep';
