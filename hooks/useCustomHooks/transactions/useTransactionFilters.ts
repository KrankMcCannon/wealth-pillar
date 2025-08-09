import { useEffect, useMemo, useState } from 'react';
import { getInitialDateRange } from '../../../constants';
import { TransactionType } from '../../../types';
import { useFinance } from '../../useFinance';

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
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
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
          if (t.category === 'trasferimento' && t.toAccountId) {
            const toAccount = getAccountById(t.toAccountId);
            belongsToUser = belongsToUser || (toAccount?.personIds.includes(selectedPersonId) || false);
          }

          return belongsToUser;
        });

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPersonId, getAccountById, isAllView]);

  // Categorie disponibili per il filtro
  const availableCategories = useMemo(() => {
    return [...new Set(personTransactions.map(t => t.category))].sort();
  }, [personTransactions]);

  // Transazioni filtrate con tutti i criteri
  const filteredTransactions = useMemo(() => {
    const start = new Date(dateRange.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setUTCHours(23, 59, 59, 999);

    let filtered = personTransactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

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

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    setCategoryFilter('all');
    const resetDateRange = getInitialDateRange(selectedPersonId, people);
    setDateRange(resetDateRange);
  };

  // Verifica se ci sono filtri attivi
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || categoryFilter !== 'all';

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
