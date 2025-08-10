import { useCallback, useMemo } from 'react';
import { Account, InvestmentHolding, Transaction } from '../../types';
import { useFinance } from '../core/useFinance';

/**
 * Interface generica per entità filtrabile
 * Principio ISP: Interface Segregation - definisce solo ciò che serve per il filtro
 */
interface FilterableEntity {
  id: string;
  personIds?: string[];
  personId?: string;
}

/**
 * Risultato generico per filtri
 * Principio ISP: Interface Segregation - risultato tipizzato e specifico
 */
interface FilterResult<T> {
  items: T[];
  isAllView: boolean;
  totalCount: number;
  filteredCount: number;
  hasItems: boolean;
}

/**
 * Hook generico per filtrare entità per persona
 * Principio DRY: Don't Repeat Yourself - logica di filtro unificata
 * Principio SRP: Single Responsibility - solo filtro generico
 * Principio OCP: Open/Closed - estendibile per nuove entità
 */
function useEntityFilter<T extends FilterableEntity>(
  entities: T[],
  selectedPersonId: string,
  filterFunction?: (entity: T, personId: string) => boolean
): FilterResult<T> {
  const isAllView = selectedPersonId === 'all';

  const filteredEntities = useMemo(() => {
    if (isAllView) return entities;

    if (filterFunction) {
      return entities.filter(entity => filterFunction(entity, selectedPersonId));
    }

    // Logica di default: controlla personIds o personId
    return entities.filter(entity => {
      if (entity.personIds) {
        return entity.personIds.includes(selectedPersonId);
      }
      if (entity.personId) {
        return entity.personId === selectedPersonId;
      }
      return false;
    });
  }, [entities, selectedPersonId, isAllView, filterFunction]);

  const result = useMemo<FilterResult<T>>(() => ({
    items: filteredEntities,
    isAllView,
    totalCount: entities.length,
    filteredCount: filteredEntities.length,
    hasItems: filteredEntities.length > 0,
  }), [filteredEntities, isAllView, entities.length]);

  return result;
}

/**
 * Hook ottimizzato per filtrare transazioni
 * Principio SRP: Single Responsibility - solo filtro transazioni
 * Principio DRY: Don't Repeat Yourself - usa hook generico
 */
export const useTransactionFilter = (selectedPersonId: string) => {
  const { transactions, getAccountById } = useFinance();

  // Funzione di filtro specializzata per transazioni
  const transactionFilterFunction = useCallback((transaction: Transaction, personId: string): boolean => {
    const account = getAccountById(transaction.accountId);
    let belongsToUser = account?.personIds.includes(personId) || false;

    // Per i trasferimenti, include anche se l'account di destinazione appartiene all'utente
    if (transaction.category === 'trasferimento' && transaction.toAccountId) {
      const toAccount = getAccountById(transaction.toAccountId);
      belongsToUser = belongsToUser || (toAccount?.personIds.includes(personId) || false);
    }

    return belongsToUser;
  }, [getAccountById]);

  const filterResult = useEntityFilter(transactions, selectedPersonId, transactionFilterFunction);

  // Calcoli aggiuntivi specifici per transazioni
  const transactionStats = useMemo(() => {
    const { items } = filterResult;
    const entrate = items.filter(t => t.type === 'entrata');
    const spese = items.filter(t => t.type === 'spesa');
    
    return {
      ...filterResult,
      transactions: items,
      entrateCount: entrate.length,
      speseCount: spese.length,
      trasferimentiCount: items.filter(t => t.category === 'trasferimento').length,
    };
  }, [filterResult]);

  return transactionStats;
};

/**
 * Hook ottimizzato per filtrare account
 * Principio SRP: Single Responsibility - solo filtro account
 */
export const useAccountFilter = (selectedPersonId: string) => {
  const { accounts } = useFinance();
  const filterResult = useEntityFilter(accounts, selectedPersonId);

  // Calcoli aggiuntivi specifici per account
  const accountStats = useMemo(() => {
    const { items } = filterResult;
    const accountTypes = new Set(items.map(acc => acc.type));
    
    return {
      ...filterResult,
      accounts: items,
      accountTypes: Array.from(accountTypes),
      hasMultipleTypes: accountTypes.size > 1,
    };
  }, [filterResult]);

  return accountStats;
};

/**
 * Hook ottimizzato per filtrare budget
 * Principio SRP: Single Responsibility - solo filtro budget
 */
export const useBudgetFilter = (selectedPersonId: string) => {
  const { budgets } = useFinance();
  const filterResult = useEntityFilter(budgets, selectedPersonId);

  // Calcoli aggiuntivi specifici per budget
  const budgetStats = useMemo(() => {
    const { items } = filterResult;
    const totalBudgetAmount = items.reduce((sum, budget) => sum + budget.amount, 0);
    
    return {
      ...filterResult,
      budgets: items,
      totalBudgetAmount,
      budgetCount: items.length,
    };
  }, [filterResult]);

  return budgetStats;
};

/**
 * Hook ottimizzato per filtrare investimenti
 * Principio SRP: Single Responsibility - solo filtro investimenti
 */
export const useInvestmentFilter = (selectedPersonId: string) => {
  const { investments } = useFinance();
  const filterResult = useEntityFilter(investments, selectedPersonId);

  // Calcoli aggiuntivi specifici per investimenti
  const investmentStats = useMemo(() => {
    const { items } = filterResult;
    const totalInvestmentValue = items.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const totalInvestmentAmount = items.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    
    return {
      ...filterResult,
      investments: items,
      totalInvestmentValue,
      totalInvestmentAmount,
      totalGainLoss: totalInvestmentValue - totalInvestmentAmount,
      averageReturn: items.length > 0 ? ((totalInvestmentValue - totalInvestmentAmount) / totalInvestmentAmount) * 100 : 0,
    };
  }, [filterResult]);

  return investmentStats;
};

/**
 * Hook combinato per ottenere tutti i filtri in una volta
 * Principio SRP: Single Responsibility - orchestrazione filtri
 * Principio DRY: Don't Repeat Yourself - evita chiamate multiple
 */
export const useAllFilters = (selectedPersonId: string) => {
  const transactionFilter = useTransactionFilter(selectedPersonId);
  const accountFilter = useAccountFilter(selectedPersonId);
  const budgetFilter = useBudgetFilter(selectedPersonId);
  const investmentFilter = useInvestmentFilter(selectedPersonId);

  const combinedStats = useMemo(() => ({
    selectedPersonId,
    isAllView: selectedPersonId === 'all',
    
    // Conteggi totali
    totalItems: 
      transactionFilter.totalCount + 
      accountFilter.totalCount + 
      budgetFilter.totalCount + 
      investmentFilter.totalCount,
    
    filteredItems: 
      transactionFilter.filteredCount + 
      accountFilter.filteredCount + 
      budgetFilter.filteredCount + 
      investmentFilter.filteredCount,
    
    // Flags di presenza dati
    hasAnyData: 
      transactionFilter.hasItems || 
      accountFilter.hasItems || 
      budgetFilter.hasItems || 
      investmentFilter.hasItems,
    
    // Singoli filtri
    transactions: transactionFilter,
    accounts: accountFilter,
    budgets: budgetFilter,
    investments: investmentFilter,
  }), [selectedPersonId, transactionFilter, accountFilter, budgetFilter, investmentFilter]);

  return combinedStats;
};

/**
 * Hook per filtri avanzati con criteri personalizzati
 * Principio OCP: Open/Closed - estendibile per nuovi criteri
 * Principio SRP: Single Responsibility - filtri avanzati
 */
export const useAdvancedFilters = () => {
  const { transactions, accounts, budgets, investments } = useFinance();

  const filterByDateRange = useCallback((
    items: Transaction[],
    startDate: string,
    endDate: string
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return items.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  }, []);

  const filterByAmount = useCallback((
    items: (Transaction | InvestmentHolding)[],
    minAmount: number,
    maxAmount: number
  ) => {
    return items.filter(item => {
      const amount = 'amount' in item ? item.amount : (item.quantity * item.currentPrice);
      return amount >= minAmount && amount <= maxAmount;
    });
  }, []);

  const filterByCategory = useCallback((
    items: Transaction[],
    categories: string[]
  ) => {
    if (categories.length === 0) return items;
    return items.filter(item => categories.includes(item.category));
  }, []);

  const filterByType = useCallback((
    items: (Transaction | Account)[],
    types: string[]
  ) => {
    if (types.length === 0) return items;
    return items.filter(item => types.includes(item.type));
  }, []);

  return {
    filterByDateRange,
    filterByAmount,
    filterByCategory,
    filterByType,
    
    // Utility per ottenere valori unici
    getUniqueCategories: () => [...new Set(transactions.map(t => t.category))],
    getUniqueAccountTypes: () => [...new Set(accounts.map(a => a.type))],
    getUniqueTransactionTypes: () => [...new Set(transactions.map(t => t.type))],
  };
};
