import React from "react";
import { useDashboardData } from "../../hooks/features/dashboard/useDashboardData";
import { usePersonFilter } from "../../hooks/data/usePersonFilter";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { AccountCard, BudgetProgress, ExpenseChart, RecentTransactionItem } from "../dashboard";
import { useFinance } from "../../hooks/core/useFinance";

export const Dashboard: React.FC = () => {
  const { isMobile, isTablet } = useBreakpoint();
  const { selectedPersonId, people, isAllView } = usePersonFilter();
  const { selectPerson } = useFinance();
  const { accountsWithData, budgetsWithData, recentTransactionsWithData, displayedTransactions } = useDashboardData();

  return (
    <div className="space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 overflow-hidden">
      {/* Header con selezione persona su mobile/tablet */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
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

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {accountsWithData.map(({ account, balance, personName }) => (
          <AccountCard key={account.id} account={account} balance={balance} personName={personName} />
        ))}
      </div>

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
};
