import React, { memo, useState, useCallback } from 'react';
import { Person } from '../../types';
import { useBudgetExceptions } from '../../hooks';
import { BaseModal, FormField, Input, ModalActions } from '../ui';
import { formatDate } from '../../constants';

interface BudgetExceptionManagerProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente per gestire le eccezioni ai periodi di budget
 * Permette di creare eccezioni temporanee per gestire casi come stipendi anticipati
 */
export const BudgetExceptionManager = memo<BudgetExceptionManagerProps>(({ 
  person, 
  isOpen, 
  onClose 
}) => {
  const {
    activeException,
    currentPeriod,
    allExceptions,
    canAddException,
    hasActiveException,
    addBudgetException,
    removeBudgetException,
    previewExceptionPeriod,
    formatExceptionDate,
    isWeekend
  } = useBudgetExceptions({ person });

  const [isCreatingException, setIsCreatingException] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler per preview dell'eccezione
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setExceptionDate(newDate);
    
    if (newDate) {
      try {
        const previewData = previewExceptionPeriod(newDate);
        setPreview(previewData);
      } catch (error) {
        console.error('Error previewing exception:', error);
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [previewExceptionPeriod]);

  // Handler per creare l'eccezione
  const handleCreateException = useCallback(async () => {
    if (!exceptionDate) return;
    
    setIsSubmitting(true);
    try {
      await addBudgetException(exceptionDate, exceptionReason || undefined);
      setIsCreatingException(false);
      setExceptionDate('');
      setExceptionReason('');
      setPreview(null);
    } catch (error) {
      console.error('Error creating exception:', error);
      // TODO: Mostrare errore all'utente
    } finally {
      setIsSubmitting(false);
    }
  }, [exceptionDate, exceptionReason, addBudgetException]);

  // Handler per rimuovere un'eccezione
  const handleRemoveException = useCallback(async (exceptionId: string) => {
    try {
      await removeBudgetException(exceptionId);
    } catch (error) {
      console.error('Error removing exception:', error);
    }
  }, [removeBudgetException]);

  const canCreateException = exceptionDate && canAddException && !isSubmitting;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestione Eccezioni Budget - ${person.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Stato Corrente */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
            Periodo Budget Corrente
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Inizio:</span>
              <span className="ml-2 font-medium">{formatDate(currentPeriod.periodStart.toISOString())}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Fine:</span>
              <span className="ml-2 font-medium">{formatDate(currentPeriod.periodEnd.toISOString())}</span>
            </div>
          </div>
          {currentPeriod.hasException && (
            <div className="mt-3 text-blue-600 dark:text-blue-400 text-sm">
              ✓ Periodo eccezionale attivo
              {currentPeriod.exception?.reason && ` (${currentPeriod.exception.reason})`}
            </div>
          )}
        </div>

        {/* Eccezione Attiva */}
        {hasActiveException && activeException && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Eccezione Attiva
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Data: {formatExceptionDate(new Date(activeException.exceptionDate))}
                </p>
                {activeException.reason && (
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Motivo: {activeException.reason}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemoveException(activeException.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
              >
                Rimuovi
              </button>
            </div>
          </div>
        )}

        {/* Crea Nuova Eccezione */}
        {canAddException && (
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            {!isCreatingException ? (
              <div className="text-center">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Crea Eccezione Budget
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Utile quando ricevi lo stipendio in una data diversa dal solito
                </p>
                <button
                  onClick={() => setIsCreatingException(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Nuova Eccezione
                </button>
              </div>
            ) : (
              <form className="space-y-4">
                <FormField
                  label="Data Eccezione"
                  required
                  error=""
                >
                  <Input
                    type="date"
                    value={exceptionDate}
                    onChange={handleDateChange}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                  {exceptionDate && isWeekend(new Date(exceptionDate)) && (
                    <p className="text-orange-600 text-xs mt-1">
                      ⚠️ La data selezionata cade in un weekend
                    </p>
                  )}
                </FormField>

                <FormField
                  label="Motivo (opzionale)"
                  error=""
                >
                  <Input
                    type="text"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="es. Stipendio anticipato"
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </FormField>

                {preview && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm">
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Anteprima Periodo Eccezionale:
                    </h5>
                    <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
                      <p>Inizio: {formatExceptionDate(preview.exceptionPeriod.periodStart)}</p>
                      <p>Fine: {formatExceptionDate(preview.exceptionPeriod.periodEnd)}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCreateException}
                    disabled={!canCreateException}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Creazione...' : 'Crea Eccezione'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingException(false);
                      setExceptionDate('');
                      setExceptionReason('');
                      setPreview(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!canAddException && !hasActiveException && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Non è possibile creare nuove eccezioni al momento
          </div>
        )}

        {/* Storico Eccezioni */}
        {allExceptions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Storico Eccezioni
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allExceptions.map((exception) => (
                <div 
                  key={exception.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {formatExceptionDate(new Date(exception.exceptionDate))}
                    </span>
                    {exception.reason && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        - {exception.reason}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveException(exception.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer con info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="mb-1">
            💡 <strong>Come funziona:</strong> Le eccezioni permettono di modificare temporaneamente 
            il periodo del budget per un singolo mese.
          </p>
          <p>
            📌 <strong>Esempio:</strong> Se ricevi normalmente lo stipendio il 15 ma questo mese 
            lo ricevi l'11, puoi creare un'eccezione per far partire il nuovo periodo l'11.
          </p>
        </div>

        {/* Actions */}
        <ModalActions
          onCancel={onClose}
          cancelLabel="Chiudi"
          showSubmit={false}
        />
      </div>
    </BaseModal>
  );
});

BudgetExceptionManager.displayName = 'BudgetExceptionManager';
