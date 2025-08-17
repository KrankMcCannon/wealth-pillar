import { memo } from "react";
import { usePersonFilter, useInvestmentFilter, useInvestmentModals } from "../../hooks";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { useFinance } from "../../hooks/core/useFinance";
import { PortfolioSummary, InvestmentTable, CompoundInterestCalculator } from "../investments";
import { AddInvestmentModal } from "../modals";
import { PlusIcon } from "../common";

/**
 * Pagina Investimenti
 */
export const InvestmentsPage = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const { selectedPersonId, isAllView, getPersonName, people } = usePersonFilter();
  const { selectPerson } = useFinance();
  const { investments } = useInvestmentFilter(selectedPersonId);
  const { isModalOpen, openModal, closeModal } = useInvestmentModals();

  return (
    <div className="space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 overflow-hidden">
      {/* Header con selezione persona su mobile/tablet */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Investimenti</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Gestisci il tuo portfolio di investimenti
            </p>
          </div>
          <button
            onClick={openModal}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm"
          >
            Aggiungi Investimento
          </button>
        </div>

        {/* Selezione persona solo su mobile/tablet */}
        {(isMobile || isTablet) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Seleziona Persona</h2>
            <div className="relative">
              <select
                className="w-full p-3 pr-10 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none shadow-sm"
                value={selectedPersonId}
                onChange={(e) => selectPerson(e.target.value)}
              >
                <option value="all">👥 Tutte le persone</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    👤 {person.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <PortfolioSummary holdings={investments} />

      <InvestmentTable holdings={investments} isAllView={isAllView} getPersonName={getPersonName} />

      <CompoundInterestCalculator />

      <AddInvestmentModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
});

InvestmentsPage.displayName = "InvestmentsPage";
