import { useCallback, useState } from 'react';
import { DateUtils } from '../../../lib/utils';
import type { Person } from '../../../types';
import { useBudgetPeriods } from './useBudgetPeriods';

/**
 * Encapsulates all state and handlers used by the BudgetPeriodButton component.
 * This hook exposes only data and functions needed by the UI, keeping the
 * component free from business logic. It leverages the existing useBudgetPeriods
 * hook to interact with backend services and manages modal visibility,
 * person selection and date adjustments. If a similar hook already exists,
 * this implementation can replace it to provide more granular control.
 */
interface Options {
  /** List of people used to populate the select. */
  people?: Person[];
  /** Optional default person id to preselect. */
  defaultPersonId?: string;
}

export const useBudgetPeriodButton = (options: Options) => {
  const { people = [], defaultPersonId } = options;

  // Guard for empty people list; nothing to manage
  const hasPeople = Array.isArray(people) && people.length > 0;
  // Modal visibility
  const [showModal, setShowModal] = useState(false);
  // Selected person
  const [selectedPersonId, setSelectedPersonId] = useState(
    defaultPersonId || people[0]?.id || ''
  );
  // Submission flag to disable controls while completing
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Completion date in ISO format
  const [completionDate, setCompletionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Derive the selected person object
  const selectedPerson: Person | undefined = people.find(
    (p) => p.id === selectedPersonId
  ) || people[0];

  // Hook handling budget period operations for the selected person
  const {
    currentPeriod,
    completedPeriods,
    canCompletePeriod,
    completePeriod,
    createNewPeriod,
    removePeriod,
    periodStats,
    formatPeriodDate,
    isLoading,
  } = useBudgetPeriods({ person: selectedPerson });

  /**
   * Close the modal and reset the internal state. Resets the completion date
   * to today and clears the selected person if no default was provided.
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
    // Reset the completion date to today
    const today = new Date().toISOString().split('T')[0];
    setCompletionDate(today);
    if (!defaultPersonId) {
      setSelectedPersonId('');
    }
  }, [defaultPersonId]);

  /**
   * Update the completion date ensuring that holidays are adjusted to the
   * previous working day. If the selected date falls on a holiday or weekend,
   * it is automatically moved backwards and a notification can be shown.
   */
  const handleDateChange = useCallback((dateString: string) => {
    const selectedDate = new Date(dateString);
    if (DateUtils.isHoliday(selectedDate)) {
      const adjustedDate = DateUtils.moveToPreviousWorkingDay(selectedDate);
      const adjustedDateString = DateUtils.toISODate(adjustedDate);
      setCompletionDate(adjustedDateString);
      // Optional: show user-facing notification about adjustment
      setTimeout(() => {
        alert(
          `Data spostata al ${adjustedDate.toLocaleDateString('it-IT')} (giorno lavorativo precedente)`
        );
      }, 100);
    } else {
      setCompletionDate(dateString);
    }
  }, []);

  /**
   * Create a new budget period for the selected person. If no person is
   * selected, the function exits early. It sets the submitting state to true
   * while the operation is in progress, and resets it after completion or error.
   * After successful creation, it closes the modal.
   */
  const handleCreateNewPeriod = useCallback(async (startDates: string[]) => {
    if (!selectedPersonId) return;
    setIsSubmitting(true);
    try {
      await createNewPeriod(startDates);
      closeModal();
    } catch (error) {
      console.error('Errore nella creazione del nuovo periodo:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPersonId, createNewPeriod, closeModal]);

  /**
   * Complete the current budget period on the chosen date. After completion
   * the completion date is reset to today and the modal is closed.
   */
  const handleCompletePeriod = useCallback(async () => {
    if (!canCompletePeriod || !completionDate) return;
    setIsSubmitting(true);
    try {
      await completePeriod(completionDate);
      const today = new Date().toISOString().split('T')[0];
      setCompletionDate(today);
      closeModal();
    } catch (error) {
      console.error('Errore nel completamento del periodo:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canCompletePeriod, completionDate, completePeriod, closeModal]);

  /**
   * Remove a completed budget period identified by its start date. Errors
   * are logged to the console.
   */
  const handleRemovePeriod = useCallback(
    async (startDate: string) => {
      try {
        await removePeriod(startDate);
      } catch (error) {
        console.error('Errore nella rimozione del periodo:', error);
      }
    },
    [removePeriod]
  );

  // Build options for the person select
  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));

  return {
    hasPeople,
    showModal,
    openModal: () => setShowModal(true),
    closeModal,
    selectedPersonId,
    setSelectedPersonId,
    selectedPerson,
    isSubmitting,
    completionDate,
    setCompletionDate,
    handleDateChange,
    handleCreateNewPeriod,
    handleCompletePeriod,
    handleRemovePeriod,
    personOptions,
    currentPeriod,
    completedPeriods,
    canCompletePeriod,
    periodStats,
    formatPeriodDate,
    isLoading,
  };
};