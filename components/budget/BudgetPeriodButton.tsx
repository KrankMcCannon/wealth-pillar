import React, { memo, useState, useCallback } from 'react';
import { Person } from '../../types';
import { BaseModal, ModalActions } from '../ui';
import { useBudgetPeriods } from '../../hooks/features/budget/useBudgetPeriods';

interface BudgetPeriodButtonProps {
  people?: Person[];
  defaultPersonId?: string;
}

/**
 * Componente per gestire i periodi di budget
 * Permette di completare il periodo corrente e passare al successivo
 */
export const BudgetPeriodButton = memo<BudgetPeriodButtonProps>(({ 
  people = [],
  defaultPersonId 
}) => {
  // Controllo di sicurezza per people
  if (!Array.isArray(people) || people.length === 0) {
    return null;
  }

  const [showModal, setShowModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId || people[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trova la persona selezionata
  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0];

  // Hook per gestire i periodi
  const {
    currentPeriod,
    completedPeriods,
    canCompletePeriod,
    completePeriod,
    removePeriod,
    periodStats,
    formatPeriodDate
  } = useBudgetPeriods({ 
    person: selectedPerson
  });

  // Reset del form quando si chiude il modale
  const handleClose = useCallback(() => {
    setShowModal(false);
    if (!defaultPersonId) {
      setSelectedPersonId('');
    }
  }, [defaultPersonId]);

  // Handler per completare il periodo
  const handleCompletePeriod = useCallback(async () => {
    if (!canCompletePeriod) return;

    setIsSubmitting(true);
    try {
      await completePeriod();
      // Non chiudere il modale per permettere di vedere i risultati
    } catch (error) {
      console.error('Errore nel completare il periodo:', error);
      // TODO: Mostrare messaggio di errore all'utente
    } finally {
      setIsSubmitting(false);
    }
  }, [canCompletePeriod, completePeriod]);

  // Handler per rimuovere un periodo completato
  const handleRemovePeriod = useCallback(async (referenceDate: string) => {
    try {
      await removePeriod(referenceDate);
    } catch (error) {
      console.error('Errore nella rimozione del periodo:', error);
    }
  }, [removePeriod]);

  // Opzioni per il select delle persone
  const personOptions = people.map(person => ({
    value: person.id,
    label: person.name
  }));

  // Se c'è solo una persona e non ci sono periodi da gestire, non mostrare il bottone
  if (people.length === 1 && !canCompletePeriod && completedPeriods.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm"
        title="Gestisci periodi di budget"
      >
        📅 Gestisci Periodi Budget
      </button>

      <BaseModal
        isOpen={showModal}
        onClose={handleClose}
        title={`Gestione Periodi Budget - ${selectedPerson?.name}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Selector persona se ci sono più persone */}
          {people.length > 1 && (
            <div>
              <label htmlFor="person-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleziona Persona
              </label>
              <select
                id="person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {personOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stato Corrente */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              Periodo Budget Corrente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Periodo:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentPeriod ? formatPeriodDate(currentPeriod.referenceDate) : 'Nessun periodo attivo'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Stato:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentPeriod?.isCompleted ? 'Completato' : 'In corso'}
                </p>
              </div>
            </div>

            {/* Azione per completare il periodo */}
            {canCompletePeriod && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCompletePeriod}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Completando...' : '✅ Completa Periodo e Passa al Successivo'}
                </button>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Questa azione segnerà il periodo corrente come completato e permetterà di iniziare il periodo successivo.
                </p>
              </div>
            )}
          </div>

          {/* Statistiche */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Statistiche Periodi
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {periodStats.total}
                </div>
                <div className="text-blue-800 dark:text-blue-200">Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {periodStats.completed}
                </div>
                <div className="text-green-800 dark:text-green-200">Completati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {periodStats.current}
                </div>
                <div className="text-orange-800 dark:text-orange-200">In Corso</div>
              </div>
            </div>
          </div>

          {/* Lista Periodi Completati */}
          {completedPeriods.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                Periodi Completati
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {completedPeriods.map(period => (
                  <div
                    key={period.referenceDate}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {formatPeriodDate(period.referenceDate)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Periodo completato
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePeriod(period.referenceDate)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      title="Rimuovi periodo"
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalActions
          onCancel={handleClose}
          cancelLabel="Chiudi"
          showSubmit={false}
        />
      </BaseModal>
    </>
  );
});

BudgetPeriodButton.displayName = 'BudgetPeriodButton';
