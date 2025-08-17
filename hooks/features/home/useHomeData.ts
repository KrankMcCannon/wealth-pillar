import { useMemo } from "react";
import { useFinance } from "../../core/useFinance";
import { TransactionUtils } from "../../../lib/utils/transaction.utils";

/**
 * Hook per la logica del Home
 */
export const useHomeData = () => {
  const {
    people,
    accounts,
    transactions,
    budgets,
    getAccountById,
    selectedPersonId,
    getPersonById,
    getCalculatedBalanceSync,
  } = useFinance();

  // Memoized data filtering per ottimizzare le performance
  const homeData = useMemo(() => {
    const isAllView = selectedPersonId === "all";
    const selectedPerson = people.find((p) => p.id === selectedPersonId);

    // Filter data based on selected person
    const displayedAccounts = isAllView ? accounts : accounts.filter((acc) => acc.personIds.includes(selectedPersonId));

    const displayedBudgets = isAllView ? budgets : budgets.filter((b) => b.personId === selectedPersonId);

    const displayedTransactions = isAllView
      ? transactions
      : transactions.filter((t) => {
          const account = getAccountById(t.accountId);
          return account?.personIds.includes(selectedPersonId);
        });

    // Recent transactions (last 5) - usando TransactionUtils
    const recentTransactions = TransactionUtils.getRecentTransactions(displayedTransactions, 5);

    return {
      isAllView,
      selectedPerson,
      displayedAccounts,
      displayedBudgets,
      displayedTransactions,
      recentTransactions,
    };
  }, [selectedPersonId, people, accounts, budgets, transactions, getAccountById]);

  // Account calculations with person names
  const accountsWithData = useMemo(() => {
    return homeData.displayedAccounts
      .map((acc) => {
        const personNames = homeData.isAllView
          ? acc.personIds
              .map((id) => getPersonById(id)?.name)
              .filter(Boolean)
              .join(", ")
          : undefined;
        const calculatedBalance = getCalculatedBalanceSync(acc.id);

        return {
          account: acc,
          balance: calculatedBalance,
          personName: personNames,
        };
      })
      .sort((a, b) => b.balance - a.balance); // Ordina dal maggiore al minore
  }, [homeData.displayedAccounts, homeData.isAllView, getPersonById, getCalculatedBalanceSync]);

  // Budget data with person information
  const budgetsWithData = useMemo(() => {
    return homeData.displayedBudgets.map((budget) => {
      const budgetPerson = getPersonById(budget.personId);
      return {
        budget,
        person: budgetPerson || homeData.selectedPerson!,
      };
    });
  }, [homeData.displayedBudgets, getPersonById, homeData.selectedPerson]);

  // Recent transactions with account and person names
  const recentTransactionsWithData = useMemo(() => {
    return homeData.recentTransactions.map((transaction) => {
      const account = getAccountById(transaction.accountId);
      const accountName = account ? account.name : "Conto sconosciuto";

      let personName: string | undefined;
      if (homeData.isAllView && account) {
        const transactionPerson = account.personIds.map((id) => getPersonById(id)).filter(Boolean)[0];
        personName = transactionPerson?.name;
      }

      return {
        transaction,
        accountName,
        personName,
      };
    });
  }, [homeData.recentTransactions, homeData.isAllView, getAccountById, getPersonById]);

  return {
    ...homeData,
    accountsWithData,
    budgetsWithData,
    recentTransactionsWithData,
  };
};
