import { useEffect, useMemo, useState } from 'react';
import { getInitialDateRange } from '../../../constants';
import { CATEGORY_CONSTANTS, CategoryUtils } from '../../../lib/utils/category.utils';
import { TransactionUtils } from '../../../lib/utils/transaction.utils';
import { TransactionType } from '../../../types';
import { useFinance } from '../../core/useFinance';

/**
 * Hook personalizzato per gestire filtri e ricerca delle transazioni
 * Principio SRP: Single Responsibility - gestisce solo la logica di filtro
 * Principio DRY: Don't Repeat Yourself - centralizza la logica di filtro riutilizzabile
 */
export const useTransactionFilters = () => {
  const { 
    transactions, 
    getAccountById, 
    selectedPersonId, 
    getPersonById, 
    people, 
    getCategoryName 
  } = useFinance();

  // Stati per i filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>(CATEGORY_CONSTANTS.ALL_CATEGORIES);
  const [dateRange, setDateRange] = useState(() => getInitialDateRange(selectedPersonId, people));

  const isAllView = selectedPersonId === 'all';

  // Aggiorna il range di date quando cambia la persona selezionata
  useEffect(() => {
    const newDateRange = getInitialDateRange(selectedPersonId, people);
    setDateRange(newDateRange);
  }, [selectedPersonId, people]);

  // Transazioni filtrate per persona
  const personTransactions = useMemo(() => {
    const filtered = isAllView
      ? transactions
      : transactions.filter(t => {
          const account = getAccountById(t.accountId);
          let belongsToUser = account?.personIds.includes(selectedPersonId);

          // Per i trasferimenti, include anche se l'account di destinazione appartiene all'utente
          if (CategoryUtils.isTransfer(t) && t.toAccountId) {
            const toAccount = getAccountById(t.toAccountId);
            belongsToUser = belongsToUser || (toAccount?.personIds.includes(selectedPersonId) || false);
          }

          return belongsToUser;
        });

    return TransactionUtils.sortByDateDesc(filtered);
  }, [transactions, selectedPersonId, getAccountById, isAllView]);

  // Categorie disponibili per il filtro
  const availableCategories = useMemo(() => {
    return CategoryUtils.getUniqueCategories(personTransactions);
  }, [personTransactions]);

  // Transazioni filtrate con tutti i criteri
  const filteredTransactions = useMemo(() => {
    let filtered = personTransactions;

    // Applica filtri sequenzialmente usando TransactionUtils
    if (typeFilter !== 'all') {
      filtered = TransactionUtils.filterByType(filtered, typeFilter);
    }

    if (categoryFilter !== CATEGORY_CONSTANTS.ALL_CATEGORIES) {
      filtered = CategoryUtils.filterByCategory(filtered, categoryFilter);
    }

    // Date range filter
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    filtered = TransactionUtils.filterByDateRange(filtered, start, end);

    // Search filter (combinato con filtro specifico app)
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(t => {
        const account = getAccountById(t.accountId);
        const personNames = account
          ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(' ')
          : '';
        const categoryName = getCategoryName(t.category);
        
        return (
          t.description.toLowerCase().includes(lowercasedFilter) ||
          t.category.toLowerCase().includes(lowercasedFilter) ||
          categoryName.toLowerCase().includes(lowercasedFilter) ||
          account?.name.toLowerCase().includes(lowercasedFilter) ||
          (isAllView && personNames.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    return TransactionUtils.sortByDateDesc(filtered);
  }, [
    personTransactions, 
    typeFilter, 
    categoryFilter, 
    searchTerm, 
    dateRange, 
    getAccountById, 
    isAllView, 
    getPersonById,
    getCategoryName
  ]);

  // Funzione per resettare tutti i filtri
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter(CATEGORY_CONSTANTS.ALL_CATEGORIES);
    const resetDateRange = getInitialDateRange(selectedPersonId, people);
    setDateRange(resetDateRange);
  };

  // Verifica se ci sono filtri attivi
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || categoryFilter !== CATEGORY_CONSTANTS.ALL_CATEGORIES;

  return {
    // Stati
    searchTerm,
    typeFilter,
    categoryFilter,
    dateRange,
    isAllView,
    
    // Setters
    setSearchTerm,
    setTypeFilter,
    setCategoryFilter,
    setDateRange,
    
    // Dati calcolati
    personTransactions,
    availableCategories,
    filteredTransactions,
    
    // Utilities
    resetFilters,
    hasActiveFilters,
    
    // Funzioni del useFinance
    getAccountById,
    getPersonById,
    getCategoryName
  };
};
