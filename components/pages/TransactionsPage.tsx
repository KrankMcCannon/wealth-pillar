import React, { useState } from 'react';
import { Card } from '../ui';
import { Transaction } from '../../types';
import { EditTransactionModal } from '../modals';
import { FilterSection, LinkingStatusBar, TransactionGroupedTable } from '../transactions';
import { useTransactionFilters, useTransactionLinking } from '../../hooks';

/**
 * TransactionsPage
 */
export const TransactionsPage: React.FC = () => {
  const {
    searchTerm,
    typeFilter,
    categoryFilter,
    dateRange,
    isAllView,
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
    getCategoryName
  } = useTransactionFilters();

  const {
    linkingTx,
    handleStartLink,
    handleCancelLink,
    handleSelectToLink,
    isTransactionLinkable,
    isThisLinkingTransaction,
    isLinkingMode
  } = useTransactionLinking();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
  };

  const handleCloseEditModal = () => {
    setEditingTx(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        Tutte le Transazioni
      </h1>

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
          <LinkingStatusBar
            linkingTx={linkingTx}
            onCancelLink={handleCancelLink}
          />
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
        <EditTransactionModal
          isOpen={!!editingTx}
          onClose={handleCloseEditModal}
          transaction={editingTx}
        />
      )}
    </div>
  );
};
