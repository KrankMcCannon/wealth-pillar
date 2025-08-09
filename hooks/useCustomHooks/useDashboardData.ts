import { useMemo } from 'react';
import { useFinance } from '../useFinance';

/**
 * Hook personalizzato per la logica del Dashboard
 * Principio SRP: Single Responsibility - gestisce solo la logica dei dati del dashboard
 * Principio DRY: Don't Repeat Yourself - centralizza la logica riutilizzabile
 */
export const useDashboardData = () => {
  const { 
    people, 
    accounts, 
    transactions, 
    budgets, 
    getAccountById, 
    selectedPersonId, 
    getPersonById, 
    getCalculatedBalance 
  } = useFinance();

  // Memoized data filtering per ottimizzare le performance
  const dashboardData = useMemo(() => {
    const isAllView = selectedPersonId === 'all';
    const selectedPerson = people.find(p => p.id === selectedPersonId);

    // Filter data based on selected person
    const displayedAccounts = isAllView
      ? accounts
      : accounts.filter(acc => acc.personIds.includes(selectedPersonId));

    const displayedBudgets = isAllView
      ? budgets
      : budgets.filter(b => b.personId === selectedPersonId);

    const displayedTransactions = isAllView
      ? transactions
      : transactions.filter(t => {
          const account = getAccountById(t.accountId);
          return account?.personIds.includes(selectedPersonId);
        });

    // Recent transactions (last 10)
    const recentTransactions = displayedTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      isAllView,
      selectedPerson,
      displayedAccounts,
      displayedBudgets,
      displayedTransactions,
      recentTransactions
    };
  }, [
    selectedPersonId, 
    people, 
    accounts, 
    budgets, 
    transactions, 
    getAccountById
  ]);

  // Account calculations with person names
  const accountsWithData = useMemo(() => {
    return dashboardData.displayedAccounts.map(acc => {
      const personNames = dashboardData.isAllView
        ? acc.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
        : undefined;
      const calculatedBalance = getCalculatedBalance(acc.id);
      
      return {
        account: acc,
        balance: calculatedBalance,
        personName: personNames
      };
    });
  }, [dashboardData.displayedAccounts, dashboardData.isAllView, getPersonById, getCalculatedBalance]);

  // Budget data with person information
  const budgetsWithData = useMemo(() => {
    return dashboardData.displayedBudgets.map(budget => {
      const budgetPerson = getPersonById(budget.personId);
      return {
        budget,
        person: budgetPerson || dashboardData.selectedPerson!
      };
    });
  }, [dashboardData.displayedBudgets, getPersonById, dashboardData.selectedPerson]);

  // Recent transactions with account and person names
  const recentTransactionsWithData = useMemo(() => {
    return dashboardData.recentTransactions.map(transaction => {
      const account = getAccountById(transaction.accountId);
      const accountName = account ? account.name : 'Conto sconosciuto';
      
      let personName: string | undefined;
      if (dashboardData.isAllView && account) {
        const transactionPerson = account.personIds
          .map(id => getPersonById(id))
          .filter(Boolean)[0];
        personName = transactionPerson?.name;
      }

      return {
        transaction,
        accountName,
        personName
      };
    });
  }, [dashboardData.recentTransactions, dashboardData.isAllView, getAccountById, getPersonById]);

  return {
    ...dashboardData,
    accountsWithData,
    budgetsWithData,
    recentTransactionsWithData
  };
};
