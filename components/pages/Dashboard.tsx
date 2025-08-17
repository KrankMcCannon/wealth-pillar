import { memo } from 'react';
import { useDashboardData } from '../../hooks';
import { useFinance } from '../../hooks';
import { AccountCard, BudgetSection, ExpenseChart, RecentTransactionsSection } from '../dashboard';

/*
 * Dashboard Component
 */
export const Dashboard = memo(() => {
  const {
    selectedPerson,
    accountsWithData,
    budgetsWithData,
    recentTransactionsWithData,
    displayedTransactions,
    isAllView
  } = useDashboardData();

  const { people } = useFinance();

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        {selectedPerson ? `Dashboard di ${selectedPerson.name}` : 'Dashboard Generale'}
      </h1>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountsWithData.map(({ account, balance, personName }) => (
          <AccountCard 
            key={account.id} 
            account={account} 
            balance={balance} 
            personName={personName} 
          />
        ))}
      </div>

      {/* Budget Section */}
      <BudgetSection
        budgetsWithData={budgetsWithData}
        transactions={displayedTransactions}
        people={people}
        isAllView={isAllView}
      />

      {/* Expense Chart */}
      <ExpenseChart
        transactions={displayedTransactions}
      />

      {/* Recent Transactions */}
      <RecentTransactionsSection
        recentTransactionsWithData={recentTransactionsWithData}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';