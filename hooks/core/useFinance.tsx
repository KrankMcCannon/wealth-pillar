import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Person, Account, Transaction, Budget, TransactionType, InvestmentHolding, CategoryOption } from '../../types';
import { ClerkSupabaseService } from '../../services/clerkSupabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useClerkSupabaseClient } from '../../lib/supabase/clerkSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

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
  getCategoryName: (categoryId: string) => string;
  getEffectiveTransactionAmount: (transaction: Transaction) => number;
  getRemainingAmount: (transaction: Transaction) => number;
  hasAvailableAmount: (transaction: Transaction) => boolean;
  isParentTransaction: (transaction: Transaction) => boolean;
  linkTransactions: (tx1Id: string, tx2Id: string) => Promise<void>;
  updatePerson: (updatedPerson: Person) => Promise<void>;
  addInvestment: (investment: Omit<InvestmentHolding, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
  getCalculatedBalance: (accountId: string) => number;
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

  const loadData = useCallback(async () => {
    // Non tentare di caricare dati se non c'è client Clerk-Supabase
    if (!client || !isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize service with authenticated client
      const supabaseService = new ClerkSupabaseService(client);

      const [peopleData, accountsData, transactionsData, budgetsData, investmentsData, categoriesData] = await Promise.all([
        supabaseService.getPeople(),
        supabaseService.getAccounts(),
        supabaseService.getTransactions(),
        supabaseService.getBudgets(),
        supabaseService.getInvestments(),
        supabaseService.getCategories(),
      ]);

      setPeople(peopleData);
      setAccounts(accountsData);
      setTransactions(transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setBudgets(budgetsData);
      setInvestments(investmentsData);
      setCategories(categoriesData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client, isSignedIn, user]);

  useEffect(() => {
    // Solo carica i dati se l'utente è autenticato e il client è disponibile
    if (isSignedIn && client && user) {
      loadData();
    } else if (!isSignedIn) {
      // Se non c'è utente, resetta lo stato
      setPeople([]);
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setInvestments([]);
      setCategories([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isSignedIn, client, user, loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Helper to get authenticated service
  const getService = useCallback(() => {
    if (!client) {
      throw new Error('Sessione non disponibile. Effettua nuovamente il login.');
    }
    if (!isSignedIn) {
      throw new Error('Utente non autenticato. Effettua il login.');
    }
    return new ClerkSupabaseService(client);
  }, [client, isSignedIn]);

  // Helper to safely get service with better error handling
  const getServiceSafely = useCallback(async (): Promise<ClerkSupabaseService> => {
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

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      const service = await getServiceSafely();

      const newTransaction: Transaction = {
        ...transactionData,
        id: uuidv4(),
        isReconciled: false,
        createdAt: new Date().toISOString(),
      };

      const savedTransaction = await service.addTransaction(newTransaction);
      setTransactions(prev => [savedTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      throw err;
    }
  }, [getServiceSafely]);

  const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    try {
      const service = await getServiceSafely();
      const savedTransaction = await service.updateTransaction(updatedTransaction);
      setTransactions(prev => prev.map(tx => 
        tx.id === savedTransaction.id ? savedTransaction : tx
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  }, [getServiceSafely]);

  const addAccount = useCallback(async (accountData: Omit<Account, 'id'>) => {
    try {
      const service = await getServiceSafely();
      const newAccount = await service.addAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
      throw err;
    }
  }, [getServiceSafely]);

  const updateAccount = useCallback(async (updatedAccount: Account) => {
    try {
      const service = await getServiceSafely();
      const savedAccount = await service.updateAccount(updatedAccount);
      setAccounts(prev => prev.map(acc => (acc.id === savedAccount.id ? savedAccount : acc)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    }
  }, [getServiceSafely]);

  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id'>) => {
    try {
      const service = await getServiceSafely();
      const newBudget = await service.addBudget(budgetData);
      setBudgets(prev => [...prev, newBudget]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget');
      throw err;
    }
  }, [getServiceSafely]);

  const updateBudget = useCallback(async (updatedBudget: Budget) => {
    try {
      const service = await getServiceSafely();
      const savedBudget = await service.updateBudget(updatedBudget);
      setBudgets(prev => prev.map(b => (b.id === savedBudget.id ? savedBudget : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
      throw err;
    }
  }, [getServiceSafely]);

  const updatePerson = useCallback(async (updatedPerson: Person) => {
    try {
      const service = await getServiceSafely();
      const savedPerson = await service.updatePerson(updatedPerson);
      setPeople(prev => prev.map(p => (p.id === savedPerson.id ? savedPerson : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
      throw err;
    }
  }, [getServiceSafely]);

  const addInvestment = useCallback(async (investmentData: Omit<InvestmentHolding, 'id'>) => {
    try {
      const service = await getServiceSafely();
      const newInvestment: InvestmentHolding = {
        ...investmentData,
        id: uuidv4(),
      };
      const savedInvestment = await service.addInvestment(newInvestment);
      setInvestments(prev => [...prev, savedInvestment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add investment');
      throw err;
    }
  }, [getServiceSafely]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(acc => acc.id === id);
  }, [accounts]);

  const getPersonById = useCallback((id: string) => {
    return people.find(p => p.id === id);
  }, [people]);

  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find(c => c.name === categoryId);
    return category ? (category.label || category.name) : categoryId;
  }, [categories]);

  // Calculate the effective amount of a transaction considering reconciliation
  const getEffectiveTransactionAmount = useCallback((transaction: Transaction) => {
    if (!transaction.isReconciled || !transaction.linkedTransactionId) {
      return transaction.amount;
    }

    const linkedTx = transactions.find(tx => tx.id === transaction.linkedTransactionId);
    if (!linkedTx) {
      return transaction.amount;
    }

    // Calculate the net effect based on transaction types
    if (transaction.type === TransactionType.SPESA && linkedTx.type === TransactionType.ENTRATA) {
      // Expense reconciled with income
      return Math.max(0, transaction.amount - linkedTx.amount);
    } else if (transaction.type === TransactionType.ENTRATA && linkedTx.type === TransactionType.SPESA) {
      // Income reconciled with expense
      return Math.max(0, transaction.amount - linkedTx.amount);
    }

    // If same type or no reconciliation logic applies, return original amount
    return transaction.amount;
  }, [transactions]);

  // Determine if a transaction is the parent in a reconciled pair
  const isParentTransaction = useCallback((transaction: Transaction) => {
    if (!transaction.isReconciled || !transaction.linkedTransactionId) {
      return false;
    }

    const linkedTx = transactions.find(tx => tx.id === transaction.linkedTransactionId);
    if (!linkedTx) {
      return false;
    }

    // Rule 1: The transaction with higher amount is always the parent
    if (transaction.amount !== linkedTx.amount) {
      return transaction.amount > linkedTx.amount;
    }
    
    // Rule 2: If amounts are equal, compare dates (earlier date = parent)
    const txDate = new Date(transaction.date);
    const linkedDate = new Date(linkedTx.date);
    
    if (txDate.getTime() !== linkedDate.getTime()) {
      return txDate <= linkedDate;
    }
    
    // Rule 3: If dates and amounts are equal, use creation timestamp
    if (transaction.createdAt && linkedTx.createdAt) {
      const txCreated = new Date(transaction.createdAt);
      const linkedCreated = new Date(linkedTx.createdAt);
      
      if (txCreated.getTime() !== linkedCreated.getTime()) {
        return txCreated <= linkedCreated;
      }
    }
    
    // Rule 4: If everything else is equal, use ID comparison for consistency
    // The transaction with lexicographically smaller ID is considered the parent
    return transaction.id < linkedTx.id;
  }, [transactions]);

  // Calculate the remaining amount of a transaction after reconciliation
  const getRemainingAmount = useCallback((transaction: Transaction) => {
    if (!transaction.isReconciled || !transaction.linkedTransactionId) {
      return transaction.amount;
    }

    const linkedTx = transactions.find(tx => tx.id === transaction.linkedTransactionId);
    if (!linkedTx) {
      return transaction.amount;
    }

    // Only the parent transaction (the one with higher amount or earlier creation) shows remaining amount
    const isParent = isParentTransaction(transaction);
    
    if (isParent) {
      // Parent transaction: remaining = original amount - linked amount
      return Math.max(0, transaction.amount - linkedTx.amount);
    } else {
      // Child transaction: remaining = 0 (it's fully consumed)
      return 0;
    }
  }, [transactions, isParentTransaction]);

  // Determine which transaction in a reconciled pair has available amount for further reconciliation
  const hasAvailableAmount = useCallback((transaction: Transaction) => {
    if (!transaction.isReconciled || !transaction.linkedTransactionId) {
      return false;
    }

    const linkedTx = transactions.find(tx => tx.id === transaction.linkedTransactionId);
    if (!linkedTx) {
      return false;
    }

    // Only the parent transaction has available amount, and only if there's a remaining amount > 0
    if (!isParentTransaction(transaction)) {
      return false;
    }
    
    // Calculate remaining amount for parent transaction
    return Math.max(0, transaction.amount - linkedTx.amount) > 0;
  }, [transactions, isParentTransaction]);

  const getCalculatedBalance = useCallback((accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;

    // Iniziamo dal bilancio iniziale dell'account (che dovrebbe essere il bilancio di partenza)
    let initialBalance = 0;

    // Calcoliamo il totale delle transazioni per questo account
    // Per i saldi degli account, usiamo SEMPRE l'importo originale delle transazioni
    // La riconciliazione non deve influenzare i movimenti reali di denaro sui conti
    const transactionTotal = transactions
      .reduce((total, tx) => {
        // Gestione trasferimenti
        if (tx.category === 'trasferimento') {
          if (tx.accountId === accountId) {
            // Account di origine del trasferimento: sottrai l'importo
            return total - tx.amount;
          } else if (tx.toAccountId === accountId) {
            // Account di destinazione del trasferimento: aggiungi l'importo
            return total + tx.amount;
          }
          // Se non è né origine né destinazione, non influisce su questo account
          return total;
        }

        // Gestione transazioni normali (non trasferimenti)
        if (tx.accountId === accountId) {
          if (tx.type === TransactionType.ENTRATA) {
            return total + tx.amount;
          } else {
            return total - tx.amount;
          }
        }

        return total;
      }, 0);

    return initialBalance + transactionTotal;
  }, [accounts, transactions]);

  const linkTransactions = useCallback(async (tx1Id: string, tx2Id: string) => {
    try {
      const service = await getServiceSafely();
      const tx1 = transactions.find(tx => tx.id === tx1Id);
      const tx2 = transactions.find(tx => tx.id === tx2Id);

      if (tx1 && tx2) {
        const updatedTx1 = { ...tx1, isReconciled: true, linkedTransactionId: tx2Id };
        const updatedTx2 = { ...tx2, isReconciled: true, linkedTransactionId: tx1Id };

        await Promise.all([
          service.updateTransaction(updatedTx1),
          service.updateTransaction(updatedTx2),
        ]);

        setTransactions(prev => prev.map(tx => {
          if (tx.id === tx1Id) return updatedTx1;
          if (tx.id === tx2Id) return updatedTx2;
          return tx;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link transactions');
      throw err;
    }
  }, [transactions, getServiceSafely]);

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