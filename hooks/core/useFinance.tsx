import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Person, Account, Transaction, Budget, InvestmentHolding, CategoryOption, Category } from '../../types';
import { ServiceFactory } from '../../lib/supabase/services/service-factory';
import { ServiceError } from '../../lib/supabase/services/base-service';
import { useAuth } from '../../contexts/AuthContext';
import { useClerkSupabaseClient } from '../../lib/supabase/client/clerk-supabase.client';
import { CategoryUtils } from '../../lib/utils/category.utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Error handling utilities following DRY principle
 */
const handleAsyncError = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (err) {
      const error = err instanceof ServiceError 
        ? err 
        : new ServiceError(
            err instanceof Error ? err.message : errorMessage,
            'UNKNOWN_ERROR',
            err as Error
          );
      console.error(errorMessage, err);
      throw error;
    }
  };
};

interface FinanceContextType {
  people: Person[];
  selectedPersonId: string;
  selectPerson: (id: string) => void;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  investments: InvestmentHolding[];
  categories: CategoryOption[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
  getPersonById: (id: string) => Person | undefined;
  getCategoryName: (categoryOrId: string | Category | null) => string;
  getEffectiveTransactionAmount: (transaction: Transaction) => number;
  getRemainingAmount: (transaction: Transaction) => number;
  hasAvailableAmount: (transaction: Transaction) => boolean;
  isParentTransaction: (transaction: Transaction) => boolean;
  linkTransactions: (tx1Id: string, tx2Id: string) => Promise<void>;
  updatePerson: (updatedPerson: Person) => Promise<void>;
  addInvestment: (investment: Omit<InvestmentHolding, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
  getCalculatedBalance: (accountId: string) => Promise<number>;
  getCalculatedBalanceSync: (accountId: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const client = useClerkSupabaseClient();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [investments, setInvestments] = useState<InvestmentHolding[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Data Loading with error handling (DRY principle)
   */
  const loadData = useCallback(
    handleAsyncError(async () => {
      if (!client || !isSignedIn || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const financeService = ServiceFactory.createFinanceService(client, user.id);
      
      // Load all data filtered by user group
      const data = await financeService.loadAllData();

      setPeople(data.people);
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setBudgets(data.budgets);
      setInvestments(data.investments);
      setCategories(data.categories);
      setIsLoading(false);
    }, 'Failed to load data'),
    [client, isSignedIn, user]
  );

  /**
   * State reset utility (DRY principle)
   */
  const resetState = useCallback(() => {
    setPeople([]);
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setInvestments([]);
    setCategories([]);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (isSignedIn && client && user) {
      loadData();
    } else if (!isSignedIn) {
      resetState();
    }
  }, [isSignedIn, client, user, loadData, resetState]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Helper to get authenticated service using Factory Pattern
  const getService = useCallback(() => {
    if (!client) {
      throw new Error('Sessione non disponibile. Effettua nuovamente il login.');
    }
    if (!isSignedIn) {
      throw new Error('Utente non autenticato. Effettua il login.');
    }
    if (!user) {
      throw new Error('Informazioni utente non disponibili.');
    }
    return ServiceFactory.createFinanceService(client, user.id);
  }, [client, isSignedIn, user]);

  // Helper to safely get service with better error handling
  const getServiceSafely = useCallback(async () => {
    if (!client && isSignedIn) {
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (client) break;
      }
    }
    
    return getService();
  }, [client, isSignedIn, getService]);

  const selectPerson = useCallback((id: string) => {
    setSelectedPersonId(id);
  }, []);

  /**
   * CRUD Operations with unified error handling (DRY principle)
   */
  const addTransaction = useCallback(
    handleAsyncError(async (transactionData: Omit<Transaction, 'id'>) => {
      const service = await getServiceSafely();
      const newTransaction: Transaction = {
        ...transactionData,
        id: uuidv4(),
        isReconciled: false,
        createdAt: new Date().toISOString(),
      };

      const savedTransaction = await service.transactions.create(newTransaction);
      setTransactions(prev => [savedTransaction, ...prev].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    }, 'Failed to add transaction'),
    [getServiceSafely]
  );

  const updateTransaction = useCallback(
    handleAsyncError(async (updatedTransaction: Transaction) => {
      const service = await getServiceSafely();
      const savedTransaction = await service.transactions.update(updatedTransaction.id, updatedTransaction);
      setTransactions(prev => 
        prev.map(tx => tx.id === savedTransaction.id ? savedTransaction : tx)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    }, 'Failed to update transaction'),
    [getServiceSafely]
  );

  const addAccount = useCallback(
    handleAsyncError(async (accountData: Omit<Account, 'id'>) => {
      const service = await getServiceSafely();
      const newAccount = await service.addAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
    }, 'Failed to add account'),
    [getServiceSafely]
  );

  const updateAccount = useCallback(
    handleAsyncError(async (updatedAccount: Account) => {
      const service = await getServiceSafely();
      const savedAccount = await service.updateAccount(updatedAccount);
      setAccounts(prev => prev.map(acc => 
        acc.id === savedAccount.id ? savedAccount : acc
      ));
    }, 'Failed to update account'),
    [getServiceSafely]
  );

  const addBudget = useCallback(
    handleAsyncError(async (budgetData: Omit<Budget, 'id'>) => {
      const service = await getServiceSafely();
      const newBudget = await service.addBudget(budgetData);
      setBudgets(prev => [...prev, newBudget]);
    }, 'Failed to add budget'),
    [getServiceSafely]
  );

  const updateBudget = useCallback(
    handleAsyncError(async (updatedBudget: Budget) => {
      const service = await getServiceSafely();
      const savedBudget = await service.updateBudget(updatedBudget);
      setBudgets(prev => prev.map(b => b.id === savedBudget.id ? savedBudget : b));
    }, 'Failed to update budget'),
    [getServiceSafely]
  );

  const updatePerson = useCallback(
    handleAsyncError(async (updatedPerson: Person) => {
      const service = await getServiceSafely();
      const savedPerson = await service.updatePerson(updatedPerson);
      setPeople(prev => prev.map(p => p.id === savedPerson.id ? savedPerson : p));
    }, 'Failed to update person'),
    [getServiceSafely]
  );

  const addInvestment = useCallback(
    handleAsyncError(async (investmentData: Omit<InvestmentHolding, 'id'>) => {
      const service = await getServiceSafely();
      const newInvestment: InvestmentHolding = {
        ...investmentData,
        id: uuidv4(),
      };
      const savedInvestment = await service.addInvestment(newInvestment);
      setInvestments(prev => [...prev, savedInvestment]);
    }, 'Failed to add investment'),
    [getServiceSafely]
  );

  /**
   * Lookup Functions (SRP principle)
   */
  const getAccountById = useCallback((id: string) => {
    return accounts.find(acc => acc.id === id);
  }, [accounts]);

  const getPersonById = useCallback((id: string) => {
    return people.find(p => p.id === id);
  }, [people]);

  /**
   * Business Logic Functions using utility classes (SRP principle)
   */
  const getCategoryName = useCallback((categoryOrId: string | Category | null) => {
    return CategoryUtils.getCategoryDisplayName(categoryOrId, categories);
  }, [categories]);

  const getEffectiveTransactionAmount = useCallback((transaction: Transaction) => {
    const linkedTx = transactions.find(tx => tx.id === transaction.parentTransactionId);
    const service = getService();
    return service.transactions.getEffectiveAmount(transaction, linkedTx);
  }, [transactions, getService]);

  const getRemainingAmount = useCallback((transaction: Transaction) => {
    if (!transaction.isReconciled) {
      return transaction.amount;
    }

    // Se la transazione ha un remainingAmount esplicitamente salvato, usa quello
    if (transaction.remainingAmount !== undefined) {
      return transaction.remainingAmount;
    }

    // Altrimenti, calcola l'importo rimanente basato sulla transazione collegata
    const linkedTx = transactions.find(tx => tx.id === transaction.parentTransactionId);
    if (!linkedTx) {
      return transaction.amount;
    }

    // Per transazioni riconciliate, calcola la differenza
    return Math.abs(transaction.amount) - Math.abs(linkedTx.amount);
  }, [transactions]);

  const hasAvailableAmount = useCallback((transaction: Transaction) => {
    const remaining = getRemainingAmount(transaction);
    return remaining > 0;
  }, [getRemainingAmount]);

  const isParentTransaction = useCallback((transaction: Transaction) => {
    const linkedTx = transactions.find(tx => tx.id === transaction.parentTransactionId);
    
    // Use TransactionService.isParentTransaction instead of duplicating logic
    const service = getService();
    return service.transactions.isParentTransaction(transaction, linkedTx);
  }, [transactions, getService]);

  const getCalculatedBalanceSync = useCallback((accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;
    
    const accountTransactions = transactions.filter(tx => 
      tx.accountId === accountId || tx.toAccountId === accountId
    );
    
    // Use FinanceService.calculateAccountBalance instead of duplicating logic
    const service = getService();
    return service.calculateAccountBalance(account, accountTransactions);
  }, [accounts, transactions, getService]);

  const getCalculatedBalance = useCallback(
    handleAsyncError(async (accountId: string) => {
      try {
        const service = await getServiceSafely();
        return await service.getCalculatedBalance(accountId);
      } catch (err) {
        // Fallback to local calculation using the same logic as getCalculatedBalanceSync
        return getCalculatedBalanceSync(accountId);
      }
    }, 'Failed to calculate balance'),
    [getCalculatedBalanceSync, getServiceSafely]
  );

  const linkTransactions = useCallback(
    handleAsyncError(async (tx1Id: string, tx2Id: string) => {
      const service = await getServiceSafely();
      
      // Use existing TransactionService.linkTransactions method instead of duplicating logic
      await service.transactions.linkTransactions(tx1Id, tx2Id);
      
      // Refresh data to get updated transactions
      await loadData();
    }, 'Failed to link transactions'),
    [getServiceSafely, loadData]
  );

  const value = {
    people,
    selectedPersonId,
    selectPerson,
    accounts,
    transactions,
    budgets,
    investments,
    categories,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    addAccount,
    updateAccount,
    addBudget,
    updateBudget,
    getAccountById,
    getPersonById,
    getCategoryName,
    getEffectiveTransactionAmount,
    getRemainingAmount,
    hasAvailableAmount,
    isParentTransaction,
    getCalculatedBalance,
    getCalculatedBalanceSync,
    linkTransactions,
    updatePerson,
    addInvestment,
    refreshData
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};