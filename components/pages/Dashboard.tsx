import React, { memo } from 'react';
import { useDashboardData } from '../../hooks';
import { AccountCard, BudgetSection, ExpenseChart, RecentTransactionsSection } from '../dashboard';

/**
 * Dashboard Component ottimizzato
 * Principi SOLID applicati:
 * - SRP: Single Responsibility - ogni componente ha una responsabilità specifica
 * - OCP: Open/Closed - facilmente estendibile con nuove sezioni
 * - DIP: Dependency Inversion - dipende da astrazioni (hooks)
 * 
 * Principi DRY applicati:
 * - Componenti riutilizzabili
 * - Logica centralizzata negli hooks
 * - Hook personalizzati per responsività e dati
 */
export const Dashboard = memo(() => {
  const {
    selectedPerson,
    accountsWithData,
    budgetsWithData,
    recentTransactionsWithData,
    displayedTransactions,
    selectedPersonId,
    isAllView
  } = useDashboardData();

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
        isAllView={isAllView}
      />

      {/* Expense Chart */}
      <ExpenseChart
        transactions={displayedTransactions}
        selectedPersonId={selectedPersonId}
      />

      {/* Recent Transactions */}
      <RecentTransactionsSection
        recentTransactionsWithData={recentTransactionsWithData}
        isAllView={isAllView}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';