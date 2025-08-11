import React, { memo, useState, useCallback } from 'react';
import { Person } from '../../types';
import { useBudgetExceptions } from '../../hooks/features/budget/useBudgetExceptions';
import { BaseModal } from '../ui/BaseModal';
import { FormField, Input, Select, ModalActions } from '../ui/FormComponents';

interface BudgetExceptionButtonProps {
  people?: Person[];
  defaultPersonId?: string;
}

/**
 * Componente per aggiungere eccezioni di budget globali
 * Permette di selezionare la persona e creare un'eccezione temporanea
 */
export const BudgetExceptionButton = memo<BudgetExceptionButtonProps>(({ 
  people = [],
  defaultPersonId 
}) => {
  // Controllo di sicurezza per people
  if (!Array.isArray(people) || people.length === 0) {
    return null;
  }

  const [showModal, setShowModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId || people[0]?.id || '');
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trova la persona selezionata
  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0];

  // Hook per gestire le eccezioni
  const {
    canAddException,
    addBudgetException,
    previewExceptionPeriod,
    hasActiveException
  } = useBudgetExceptions({ 
    person: selectedPerson
  });

  // Reset del form quando si chiude il modale
  const handleClose = useCallback(() => {
    setShowModal(false);
    setExceptionDate('');
    setExceptionReason('');
    if (!defaultPersonId) {
      setSelectedPersonId('');
    }
  }, [defaultPersonId]);

  // Handler per aggiungere l'eccezione
  const handleAddException = useCallback(async () => {
    if (!selectedPerson || !exceptionDate.trim()) return;

    setIsSubmitting(true);
    try {
      await addBudgetException(exceptionDate, exceptionReason || undefined);
      handleClose();
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'eccezione:', error);
      // TODO: Mostrare messaggio di errore all'utente
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPerson, exceptionDate, exceptionReason, addBudgetException, handleClose]);

  // Calcola l'anteprima del periodo eccezionale
  let preview = null;
  if (selectedPerson && exceptionDate) {
    try {
      preview = previewExceptionPeriod(exceptionDate);
    } catch (error) {
      // Ignora errori di preview
    }
  }

  // Opzioni per il select delle persone
  const personOptions = people.map(person => ({
    value: person.id,
    label: person.name
  }));

  // Se c'è solo una persona, non mostrare il bottone se ha già un'eccezione attiva
  if (people.length === 1 && selectedPerson && hasActiveException) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm"
        title="Aggiungi eccezione temporanea al budget"
      >
        📅 Gestisci Eccezioni Budget
      </button>

      <BaseModal
        isOpen={showModal}
        onClose={handleClose}
        title="Aggiungi Eccezione Budget"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Spiegazione */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              Eccezioni Budget
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Le eccezioni permettono di modificare temporaneamente il periodo di budget 
              per gestire situazioni eccezionali come stipendi anticipati o ritardati. 
              L'eccezione si applica a tutti i budget della persona selezionata.
            </p>
          </div>

          {/* Selezione persona */}
          {people.length > 1 && (
            <FormField
              label="Persona"
              required
            >
              <Select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                options={[
                  { value: '', label: 'Seleziona una persona...' },
                  ...personOptions
                ]}
                disabled={isSubmitting}
              />
            </FormField>
          )}

          {/* Mostra informazioni sulla persona selezionata */}
          {selectedPerson && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-medium text-gray-800 dark:text-white mb-2">
                {selectedPerson.name}
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>📅 Budget Start Date: {selectedPerson.budgetStartDate}</div>
                {hasActiveException && (
                  <div className="text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Ha già un'eccezione attiva
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data dell'eccezione */}
          {selectedPerson && canAddException && (
            <>
              <FormField
                label="Data dell'eccezione"
                required
              >
                <Input
                  type="date"
                  value={exceptionDate}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  placeholder="Seleziona la data eccezionale"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Motivo (opzionale)">
                <Input
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="es. Stipendio anticipato"
                  disabled={isSubmitting}
                />
              </FormField>

              {/* Preview del periodo eccezionale */}
              {preview && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 dark:text-white mb-2">
                    Anteprima periodo eccezionale:
                  </h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>📅 Dal: {preview.exceptionPeriod.periodStart.toLocaleDateString()}</div>
                    <div>📅 Al: {preview.exceptionPeriod.periodEnd.toLocaleDateString()}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Il prossimo periodo tornerà al normale budgetStartDate
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Messaggio se non può aggiungere eccezioni */}
          {selectedPerson && !canAddException && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-orange-700 dark:text-orange-400 text-sm">
                {selectedPerson.name} ha già un'eccezione attiva. 
                Non è possibile aggiungere una nuova eccezione finché quella corrente non scade.
              </p>
            </div>
          )}

          <ModalActions
            onCancel={handleClose}
            onSubmit={selectedPerson && canAddException ? handleAddException : undefined}
            submitLabel="Aggiungi Eccezione"
            cancelLabel="Annulla"
            isSubmitting={isSubmitting}
            disabled={!selectedPerson || !canAddException || !exceptionDate.trim()}
          />
        </div>
      </BaseModal>
    </>
  );
});

BudgetExceptionButton.displayName = 'BudgetExceptionButton';
