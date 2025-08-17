import React, { memo } from "react";
import { Person } from "../../types";
import { BaseModal, ModalActions } from "../ui";
import { useBudgetPeriodButton } from "../../hooks/features/budgets/useBudgetPeriodButton";

interface BudgetPeriodButtonProps {
  people?: Person[];
}

/**
 * Componente per gestire i periodi di budget
 * Permette di completare il periodo corrente e passare al successivo
 */
export const BudgetPeriodButton = memo<BudgetPeriodButtonProps>(({ people = [] }) => {
  const {
    hasPeople,
    showModal,
    openModal,
    closeModal,
    selectedPersonId,
    setSelectedPersonId,
    selectedPerson,
    isSubmitting,
    completionDate,
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
  } = useBudgetPeriodButton({
    people,
    defaultPersonId: people[0]?.id || "",
  });

  // Controllo di sicurezza per people
  if (!hasPeople) {
    return null;
  }

  // Se c'è solo una persona e non ci sono periodi da gestire, non mostrare il bottone
  if (people.length === 1 && !canCompletePeriod && completedPeriods.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap"
        title="Gestisci periodi di budget"
      >
        <span className="hidden sm:inline">Gestisci Periodi Budget</span>
        <span className="sm:hidden">Periodi</span>
      </button>

      <BaseModal
        isOpen={showModal}
        onClose={closeModal}
        title={`Gestione Periodi Budget - ${selectedPerson?.name}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Selector persona se ci sono più persone */}
          {people.length > 1 && (
            <div>
              <label
                htmlFor="person-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Seleziona Persona
              </label>
              <select
                id="person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {personOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stato Corrente */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Periodo Budget Corrente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Periodo:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentPeriod
                    ? formatPeriodDate(currentPeriod.startDate, currentPeriod.endDate)
                    : "Nessun periodo attivo"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Stato:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentPeriod ? (currentPeriod.isCompleted ? "Completato" : "In corso") : "Inattivo"}
                </p>
              </div>
            </div>

            {/* Azione per iniziare un nuovo periodo quando non ce n'è uno attivo */}
            {!currentPeriod && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Seleziona la data di inizio del nuovo periodo
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      value={completionDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleCreateNewPeriod(
                        selectedPerson.budgetPeriods.length > 0
                          ? selectedPerson.budgetPeriods.map((p) => p.startDate)
                          : [currentPeriod.startDate]
                      )
                    }
                    disabled={!completionDate || isLoading}
                    className="w-full px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creazione..." : "Inizia Nuovo Periodo"}
                  </button>
                </div>
              </div>
            )}

            {/* Azione per completare il periodo */}
            {canCompletePeriod && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="completion-date"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Seleziona la data di chiusura del periodo
                    </label>
                    <input
                      type="date"
                      id="completion-date"
                      value={completionDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    onClick={handleCompletePeriod}
                    disabled={isSubmitting || !completionDate}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Completando..." : "✅ Completa Periodo"}
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Seleziona la data di chiusura e clicca per completare il periodo corrente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Statistiche */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Statistiche Periodi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{periodStats.total}</div>
                <div className="text-blue-800 dark:text-blue-200">Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{periodStats.completed}</div>
                <div className="text-green-800 dark:text-green-200">Completati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{periodStats.current}</div>
                <div className="text-orange-800 dark:text-orange-200">In Corso</div>
              </div>
            </div>
          </div>

          {/* Lista Periodi Completati */}
          {completedPeriods.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Periodi Completati</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {completedPeriods.map((period) => (
                  <div
                    key={period.startDate}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {formatPeriodDate(period.startDate, period.endDate)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Periodo completato</div>
                    </div>
                    <button
                      onClick={() => handleRemovePeriod(period.startDate)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

        <ModalActions onCancel={closeModal} cancelText="Chiudi" />
      </BaseModal>
    </>
  );
});

BudgetPeriodButton.displayName = "BudgetPeriodButton";
