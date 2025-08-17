import { useCallback, useState } from "react";
import { DateUtils } from "../../../lib/utils";
import type { Person } from "../../../types";
import { useBudgetPeriods } from "./useBudgetPeriods";

interface Options {
  people?: Person[];
  defaultPersonId?: string;
}

/**
 * Hook semplificato per il BudgetPeriodButton
 * Gestisce solo lo stato UI e delega la logica di business al service
 */
export const useBudgetPeriodButton = (options: Options) => {
  const { people = [], defaultPersonId } = options;

  // Controlli di base
  const hasPeople = Array.isArray(people) && people.length > 0;

  // Stato UI
  const [showModal, setShowModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId || people[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionDate, setCompletionDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Persona selezionata
  const selectedPerson: Person | undefined = people.find((p) => p.id === selectedPersonId) || people[0];

  // Hook per i periodi
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

  // Chiudi modal e reset stato
  const closeModal = useCallback(() => {
    setShowModal(false);
    const today = new Date().toISOString().split("T")[0];
    setCompletionDate(today);
    if (!defaultPersonId) {
      setSelectedPersonId("");
    }
  }, [defaultPersonId]);

  // Gestione cambio data con aggiustamento automatico
  const handleDateChange = useCallback((dateString: string) => {
    const selectedDate = new Date(dateString);
    if (DateUtils.isHoliday(selectedDate)) {
      const adjustedDate = DateUtils.moveToPreviousWorkingDay(selectedDate);
      const adjustedDateString = DateUtils.toISODate(adjustedDate);
      setCompletionDate(adjustedDateString);

      // Notifica all'utente
      setTimeout(() => {
        alert(`Data spostata al ${adjustedDate.toLocaleDateString("it-IT")} (giorno lavorativo precedente)`);
      }, 100);
    } else {
      setCompletionDate(dateString);
    }
  }, []);

  // Crea nuovo periodo
  const handleCreateNewPeriod = useCallback(
    async (startDates: string[]) => {
      if (!selectedPersonId) return;
      setIsSubmitting(true);
      try {
        await createNewPeriod(startDates);
        closeModal();
      } catch (error) {
        console.error("Errore nella creazione del nuovo periodo:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedPersonId, createNewPeriod, closeModal]
  );

  // Completa periodo
  const handleCompletePeriod = useCallback(async () => {
    if (!canCompletePeriod || !completionDate) return;
    setIsSubmitting(true);
    try {
      await completePeriod(completionDate);
      const today = new Date().toISOString().split("T")[0];
      setCompletionDate(today);
      closeModal();
    } catch (error) {
      console.error("Errore nel completamento del periodo:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canCompletePeriod, completionDate, completePeriod, closeModal]);

  // Rimuovi periodo
  const handleRemovePeriod = useCallback(
    async (startDate: string) => {
      try {
        await removePeriod(startDate);
      } catch (error) {
        console.error("Errore nella rimozione del periodo:", error);
      }
    },
    [removePeriod]
  );

  // Opzioni per il select persona
  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));

  return {
    // Controlli
    hasPeople,

    // Stato UI
    showModal,
    openModal: () => setShowModal(true),
    closeModal,
    selectedPersonId,
    setSelectedPersonId,
    selectedPerson,
    isSubmitting,
    completionDate,
    setCompletionDate,

    // Handlers
    handleDateChange,
    handleCreateNewPeriod,
    handleCompletePeriod,
    handleRemovePeriod,

    // Dati
    personOptions,
    currentPeriod,
    completedPeriods,
    canCompletePeriod,
    periodStats,
    formatPeriodDate,
    isLoading,
  };
};
