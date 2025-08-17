import React, { useState } from "react";
import { useTransactionFilters, useTransactionLinking } from "../../hooks";
import { Transaction } from "../../types";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { usePersonFilter } from "../../hooks/data/usePersonFilter";
import { useFinance } from "../../hooks/core/useFinance";
import { Card } from "../ui";
import { FilterSection, LinkingStatusBar, TransactionGroupedTable } from "../transactions";
import { EditTransactionModal } from "../modals";

/**
 * TransactionsPage
 */
export const TransactionsPage: React.FC = () => {
  const { isMobile, isTablet } = useBreakpoint();
  const { selectedPersonId, people, isAllView } = usePersonFilter();
  const { selectPerson } = useFinance();
  const {
    searchTerm,
    typeFilter,
    categoryFilter,
    dateRange,
    setSearchTerm,
    setTypeFilter,
    setCategoryFilter,
    setDateRange,
    availableCategories,
    groupedTransactions,
    resetFilters,
    hasActiveFilters,
    getAccountById,
    getPersonById,
    getCategoryName,
  } = useTransactionFilters();
  const {
    isLinkingMode,
    linkingTx,
    handleStartLink,
    handleSelectToLink,
    handleCancelLink,
    isTransactionLinkable,
    isThisLinkingTransaction,
  } = useTransactionLinking();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
  };

  const handleCloseEditModal = () => {
    setEditingTx(null);
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 overflow-hidden">
      {/* Header con selezione persona su mobile/tablet */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Transazioni</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Gestisci e visualizza tutte le tue transazioni finanziarie
          </p>
        </div>

        {/* Selezione persona solo su mobile/tablet */}
        {(isMobile || isTablet) && people.length > 1 && (
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

      {/* Sezione Filtri */}
      <Card>
        <FilterSection
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          categoryFilter={categoryFilter}
          dateRange={dateRange}
          availableCategories={availableCategories}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onCategoryFilterChange={setCategoryFilter}
          onDateRangeChange={setDateRange}
          onResetFilters={resetFilters}
          getCategoryName={getCategoryName}
        />
      </Card>

      {/* Barra di stato del linking */}
      {linkingTx && (
        <Card>
          <LinkingStatusBar linkingTx={linkingTx} onCancelLink={handleCancelLink} />
        </Card>
      )}

      {/* Gruppi di transazioni raggruppate per data */}
      <Card>
        <TransactionGroupedTable
          groupedTransactions={groupedTransactions}
          isAllView={isAllView}
          isLinkingMode={isLinkingMode}
          linkingTx={linkingTx}
          onLinkClick={handleStartLink}
          onSelectToLink={handleSelectToLink}
          onEditClick={handleEditTransaction}
          getAccountById={getAccountById}
          getPersonById={getPersonById}
          isTransactionLinkable={isTransactionLinkable}
          isThisLinkingTransaction={isThisLinkingTransaction}
        />
      </Card>

      {/* Modal di modifica transazione */}
      {editingTx && (
        <EditTransactionModal isOpen={!!editingTx} onClose={handleCloseEditModal} transaction={editingTx} />
      )}
    </div>
  );
};
