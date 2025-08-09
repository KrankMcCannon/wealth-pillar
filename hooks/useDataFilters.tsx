import { useMemo } from 'react';
import { Transaction, Account } from '../types';
import { useFinance } from './useFinance';

/**
 * Hook per filtrare transazioni basate su persona/account
 * Principio SRP: Single Responsibility - gestisce solo il filtro delle transazioni
 */
export const useTransactionFilter = (selectedPersonId: string) => {
  const { transactions, getAccountById } = useFinance();
  const isAllView = selectedPersonId === 'all';

  const filteredTransactions = useMemo(() => {
    if (isAllView) return transactions;
    
    return transactions.filter(transaction => {
      const account = getAccountById(transaction.accountId);
      let belongsToUser = account?.personIds.includes(selectedPersonId);

      // Per i trasferimenti, include anche se l'account di destinazione appartiene all'utente
      if (transaction.category === 'trasferimento' && transaction.toAccountId) {
        const toAccount = getAccountById(transaction.toAccountId);
        belongsToUser = belongsToUser || (toAccount?.personIds.includes(selectedPersonId) || false);
      }

      return belongsToUser;
    });
  }, [transactions, selectedPersonId, isAllView, getAccountById]);

  return {
    transactions: filteredTransactions,
    isAllView,
  };
};

/**
 * Hook per filtrare account basati su persona
 * Principio SRP: Single Responsibility - gestisce solo il filtro degli account
 */
export const useAccountFilter = (selectedPersonId: string) => {
  const { accounts } = useFinance();
  const isAllView = selectedPersonId === 'all';

  const filteredAccounts = useMemo(() => {
    if (isAllView) return accounts;
    return accounts.filter(acc => acc.personIds.includes(selectedPersonId));
  }, [accounts, selectedPersonId, isAllView]);

  return {
    accounts: filteredAccounts,
    isAllView,
  };
};

/**
 * Hook per filtrare budget basati su persona
 * Principio SRP: Single Responsibility - gestisce solo il filtro dei budget
 */
export const useBudgetFilter = (selectedPersonId: string) => {
  const { budgets } = useFinance();
  const isAllView = selectedPersonId === 'all';

  const filteredBudgets = useMemo(() => {
    if (isAllView) return budgets;
    return budgets.filter(b => b.personId === selectedPersonId);
  }, [budgets, selectedPersonId, isAllView]);

  return {
    budgets: filteredBudgets,
    isAllView,
  };
};

/**
 * Hook per filtrare investimenti basati su persona
 * Principio SRP: Single Responsibility - gestisce solo il filtro degli investimenti
 */
export const useInvestmentFilter = (selectedPersonId: string) => {
  const { investments } = useFinance();
  const isAllView = selectedPersonId === 'all';

  const filteredInvestments = useMemo(() => {
    if (isAllView) return investments;
    return investments.filter(inv => inv.personId === selectedPersonId);
  }, [investments, selectedPersonId, isAllView]);

  return {
    investments: filteredInvestments,
    isAllView,
  };
};
