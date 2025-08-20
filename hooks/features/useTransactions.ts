import { useCallback, useMemo, useState } from 'react';
import { CategoryUtils } from '../../lib/utils/category.utils';
import { Transaction, TransactionType } from '../../types';
import { useFinance } from '../core/useFinance';
import { useModalForm } from '../ui/useModalForm';
import { useModal } from '../ui/useModal';

/**
 * Interface per i dati del form transazione
 */
interface TransactionFormData {
  amount: number;
  description: string;
  category: string;
  date: string;
  type: TransactionType;
  accountId: string;
  toAccountId?: string;
}

/**
 * Hook consolidato per gestire tutte le operazioni sulle transazioni
 * Principio SRP: Single Responsibility - gestisce operazioni transazioni
 * Principio DRY: Don't Repeat Yourself - unifica Add/Edit/Filter/Visual logic
 */
export const useTransactions = () => {
  const { 
    transactions, 
    accounts, 
    addTransaction, 
    updateTransaction, 
    getAccountById 
  } = useFinance();

  // === FILTRI E VISUALIZZAZIONE ===
  
  const [filters, setFilters] = useState({
    personId: 'all',
    dateRange: { start: '', end: '' },
    categories: [] as string[],
    types: [] as string[],
    minAmount: 0,
    maxAmount: 0,
  });

  const [visualSettings, setVisualSettings] = useState({
    viewMode: 'cards' as 'cards' | 'table' | 'grouped',
    groupBy: 'date' as 'date' | 'category' | 'account',
    sortBy: 'date' as 'date' | 'amount' | 'category',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  // Filtri avanzati
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtro per persona
    if (filters.personId !== 'all') {
      filtered = filtered.filter(transaction => {
        const account = getAccountById(transaction.accountId);
        let belongsToUser = account?.personIds.includes(filters.personId) || false;

        if (CategoryUtils.isTransfer(transaction) && transaction.toAccountId) {
          const toAccount = getAccountById(transaction.toAccountId);
          belongsToUser = belongsToUser || (toAccount?.personIds.includes(filters.personId) || false);
        }

        return belongsToUser;
      });
    }

    // Filtro per date
    if (filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    }

    // Filtro per categorie
    if (filters.categories.length > 0) {
      filtered = filtered.filter(t => filters.categories.includes(t.category));
    }

    // Filtro per tipi
    if (filters.types.length > 0) {
      filtered = filtered.filter(t => filters.types.includes(t.type));
    }

    // Filtro per importo
    if (filters.minAmount > 0 || filters.maxAmount > 0) {
      filtered = filtered.filter(t => {
        const amount = Math.abs(t.amount);
        return (!filters.minAmount || amount >= filters.minAmount) &&
               (!filters.maxAmount || amount <= filters.maxAmount);
      });
    }

    return filtered;
  }, [transactions, filters, getAccountById]);

  // Transazioni ordinate e raggruppate
  const processedTransactions = useMemo(() => {
    let sorted = [...filteredTransactions];

    // Ordinamento
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (visualSettings.sortBy) {
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'date':
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }

      return visualSettings.sortDirection === 'asc' ? comparison : -comparison;
    });

    // Raggruppamento
    if (visualSettings.viewMode === 'grouped') {
      const grouped = new Map<string, Transaction[]>();
      
      sorted.forEach(transaction => {
        let groupKey = '';
        
        switch (visualSettings.groupBy) {
          case 'category':
            groupKey = transaction.category;
            break;
          case 'account':
            const account = getAccountById(transaction.accountId);
            groupKey = account?.name || 'Account sconosciuto';
            break;
          case 'date':
          default:
            groupKey = new Date(transaction.date).toLocaleDateString('it-IT', { 
              year: 'numeric', 
              month: 'long' 
            });
            break;
        }

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, []);
        }
        grouped.get(groupKey)!.push(transaction);
      });

      return Array.from(grouped.entries()).map(([key, items]) => ({
        groupKey: key,
        items,
        count: items.length,
        totalAmount: items.reduce((sum, t) => sum + t.amount, 0),
      }));
    }

    return sorted;
  }, [filteredTransactions, visualSettings, getAccountById]);

  // === FORM MANAGEMENT ===

  const reconciliationModal = useModal();
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const getInitialFormData = useCallback((existingTransaction?: Transaction): TransactionFormData => ({
    amount: existingTransaction?.amount || 0,
    description: existingTransaction?.description || "",
    category: existingTransaction?.category || "",
    date: existingTransaction?.date || new Date().toISOString().split('T')[0],
    type: existingTransaction?.type || TransactionType.SPESA,
    accountId: existingTransaction?.accountId || (accounts[0]?.id || ''),
    toAccountId: existingTransaction?.toAccountId,
  }), [accounts]);

  const validateTransactionForm = useCallback((data: TransactionFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.description.trim()) {
      errors.description = "La descrizione è obbligatoria";
    }

    if (data.amount <= 0) {
      errors.amount = "L'importo deve essere positivo";
    }

    if (!data.category) {
      errors.category = "La categoria è obbligatoria";
    }

    if (!data.accountId) {
      errors.accountId = "L'account è obbligatorio";
    }

    // Note: trasferimento is not in TransactionType enum, handle as needed
    if (data.type === 'trasferimento' as any && !data.toAccountId) {
      errors.toAccountId = "L'account di destinazione è obbligatorio per i trasferimenti";
    }

    if (data.type === 'trasferimento' as any && data.accountId === data.toAccountId) {
      errors.toAccountId = "L'account di destinazione deve essere diverso da quello di origine";
    }

    return errors;
  }, []);

  // === CRUD OPERATIONS ===

  const useTransactionForm = (existingTransaction?: Transaction) => {
    const initialData = getInitialFormData(existingTransaction);
    
    const form = useModalForm({
      initialData,
      resetOnClose: true,
      resetOnOpen: true,
    });

    const handleSubmit = useCallback(async (onClose: () => void) => {
      const errors = validateTransactionForm(form.data);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => {
          form.setError(field, message);
        });
        return;
      }

      form.setSubmitting(true);

      try {
        const transactionData = {
          amount: form.data.amount,
          description: form.data.description.trim(),
          category: form.data.category,
          date: form.data.date,
          type: form.data.type,
          accountId: form.data.accountId,
          toAccountId: form.data.toAccountId,
        };

        if (existingTransaction) {
          await updateTransaction({ ...existingTransaction, ...transactionData });
        } else {
          await addTransaction(transactionData);
        }

        onClose();
      } catch (err) {
        form.setError("general", err instanceof Error ? err.message : "Errore durante l'operazione");
      } finally {
        form.setSubmitting(false);
      }
    }, [form, existingTransaction, validateTransactionForm, addTransaction, updateTransaction]);

    return {
      ...form,
      handleSubmit,
    };
  };

  // === RECONCILIATION ===

  const handleReconciliation = useCallback(async (groupName: string) => {
    if (selectedTransactions.length < 2) return;

    try {
      // Logica di riconciliazione
      console.log('Reconciling transactions:', selectedTransactions, 'with group:', groupName);
      
      reconciliationModal.closeModal();
      setSelectedTransactions([]);
    } catch (error) {
      console.error('Errore durante la riconciliazione:', error);
    }
  }, [selectedTransactions, reconciliationModal]);

  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  }, []);

  // === UTILITY FUNCTIONS ===

  const getTransactionRowClasses = useCallback((transaction: Transaction): string => {
    const baseClasses = "transaction-row";
    const typeClasses = {
      'entrata': 'transaction-entrata',
      'spesa': 'transaction-spesa',
      'trasferimento': 'transaction-trasferimento',
    };

    const classes = [baseClasses, typeClasses[transaction.type]];

    if (selectedTransactions.includes(transaction.id)) {
      classes.push('transaction-selected');
    }

    if (CategoryUtils.isTransfer(transaction)) {
      classes.push('transaction-transfer');
    }

    return classes.join(' ');
  }, [selectedTransactions]);

  const getUniqueCategories = useCallback(() => {
    return CategoryUtils.getUniqueCategories(transactions);
  }, [transactions]);

  const getUniqueTypes = useCallback(() => {
    return [...new Set(transactions.map(t => t.type))];
  }, [transactions]);

  // === RETURN API ===

  return {
    // Data
    transactions: processedTransactions,
    filteredTransactions,
    rawTransactions: transactions,
    
    // Filtering
    filters,
    setFilters,
    updateFilter: useCallback((key: keyof typeof filters, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    }, []),
    
    // Visual settings
    visualSettings,
    setVisualSettings,
    updateVisualSetting: useCallback((key: keyof typeof visualSettings, value: any) => {
      setVisualSettings(prev => ({ ...prev, [key]: value }));
    }, []),
    
    // Form management
    useTransactionForm,
    
    // Reconciliation
    reconciliationModal,
    selectedTransactions,
    setSelectedTransactions,
    handleReconciliation,
    toggleTransactionSelection,
    
    // Utilities
    getTransactionRowClasses,
    getUniqueCategories,
    getUniqueTypes,
    
    // Statistics
    stats: useMemo(() => {
      const entrate = filteredTransactions.filter(t => t.type === TransactionType.ENTRATA);
      const spese = filteredTransactions.filter(t => t.type === TransactionType.SPESA);
      const trasferimenti = filteredTransactions.filter(t => CategoryUtils.isTransfer(t));

      return {
        total: filteredTransactions.length,
        entrate: {
          count: entrate.length,
          total: entrate.reduce((sum, t) => sum + t.amount, 0),
        },
        spese: {
          count: spese.length,
          total: spese.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        },
        trasferimenti: {
          count: trasferimenti.length,
          total: trasferimenti.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        },
      };
    }, [filteredTransactions]),
  };
};
