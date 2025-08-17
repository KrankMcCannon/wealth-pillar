import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHomeData } from "../../hooks/features/home/useHomeData";
import { useAccountOrdering } from "../../hooks/features/home/useAccountOrdering";
import { usePersonFilter } from "../../hooks/data/usePersonFilter";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { DraggableAccountCard, BudgetProgress, ExpenseChart, RecentTransactionItem } from "../home";
import { useFinance } from "../../hooks/core/useFinance";

export const Home = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const { selectedPersonId, people } = usePersonFilter();
  const { selectPerson } = useFinance();
  const { accountsWithData, budgetsWithData, recentTransactionsWithData, displayedTransactions } = useHomeData();

  const {
    orderedAccounts,
    draggedIndex,
    dragOverIndex,
    showSuccessFeedback,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  } = useAccountOrdering(accountsWithData);

  return (
    <div className="space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 overflow-hidden">
      {/* Toast di successo */}
      <AnimatePresence>
        {showSuccessFeedback && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Ordinamento salvato!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con logo e selezione persona su mobile/tablet */}
      <div className="space-y-4">
        {/* Logo e nome app su mobile/tablet quando sidebar non è visibile */}
        {(isMobile || isTablet) && (
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--theme-color)" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold ml-3 text-gray-800 dark:text-white">Wealth Pillar</h1>
          </div>
        )}

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Home</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            Panoramica completa delle tue finanze
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

      {/* Accounts Grid con Drag and Drop */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {orderedAccounts.map((accountData, index) => (
            <DraggableAccountCard
              key={accountData.account.id}
              accountData={accountData}
              index={index}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Budget Section */}
      <BudgetProgress
        budgets={budgetsWithData.map((b) => b.budget)}
        people={people}
        selectedPersonId={selectedPersonId}
        isReportMode={false}
      />

      {/* Expense Chart */}
      <ExpenseChart transactions={displayedTransactions} />

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transazioni Recenti</h2>
          <div className="space-y-3">
            {recentTransactionsWithData.slice(0, 5).map(({ transaction, accountName }) => (
              <RecentTransactionItem key={transaction.id} transaction={transaction} accountName={accountName} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
