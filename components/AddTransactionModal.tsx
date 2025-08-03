import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFinance } from '../hooks/useFinance';
import { TransactionType } from '../types';
import { SparklesIcon } from './Icons';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, accounts, selectedPersonId, people, categories } = useFinance();
  
  const isAllView = selectedPersonId === 'all';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.SPESA);
  const [category, setCategory] = useState<string>('altro');
  // This state is for the person selected *inside the modal*, only used in 'all' view.
  const [txPersonId, setTxPersonId] = useState<string>(isAllView ? people[0]?.id || '' : selectedPersonId);
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>(''); // Account di destinazione per trasferimenti
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const personAccounts = useMemo(() => {
    const currentPersonId = isAllView ? txPersonId : selectedPersonId;
    return accounts.filter(acc => acc.personIds.includes(currentPersonId));
  }, [accounts, selectedPersonId, txPersonId, isAllView]);

  // Account disponibili per trasferimenti (tutti gli account della persona)
  const allPersonAccounts = useMemo(() => {
    const currentPersonId = isAllView ? txPersonId : selectedPersonId;
    return accounts.filter(acc => acc.personIds.includes(currentPersonId));
  }, [accounts, selectedPersonId, txPersonId, isAllView]);

  const resetForm = useCallback(() => {
    const currentPersonId = isAllView ? (people[0]?.id || '') : selectedPersonId;
    const initialAccounts = accounts.filter(acc => acc.personIds.includes(currentPersonId));
    
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.SPESA);
    setCategory('altro');
    setTxPersonId(currentPersonId);
    setAccountId(initialAccounts[0]?.id || '');
    setToAccountId('');
    setError('');
    setIsSubmitting(false);
  }, [people, accounts, selectedPersonId, isAllView]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);
  
  useEffect(() => {
    // If the person selection (inside the modal) changes, reset the account
    const newAccounts = accounts.filter(acc => acc.personIds.includes(txPersonId));
    if (!newAccounts.some(acc => acc.id === accountId)) {
      setAccountId(newAccounts[0]?.id || '');
    }
  }, [txPersonId, accounts, accountId]);

  const handleDescriptionBlur = async () => {
    if (description.trim().length > 3) {
      setIsSuggesting(true);
      // const suggestion = await getCategorySuggestion(description, CATEGORY_OPTIONS);
      // if (suggestion) {
      //   setCategory(suggestion);
      // }
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !accountId || !category || !date) {
        setError('Compila tutti i campi obbligatori.');
        return;
    }

    // Per i trasferimenti, verifica che sia selezionato un account di destinazione
    if (category === 'trasferimento' && !toAccountId) {
        setError('Seleziona un account di destinazione per il trasferimento.');
        return;
    }

    // Per i trasferimenti, verifica che gli account di origine e destinazione siano diversi
    if (category === 'trasferimento' && accountId === toAccountId) {
        setError('Gli account di origine e destinazione devono essere diversi.');
        return;
    }

    setError('');
    setIsSubmitting(true);

    const numericAmount = parseFloat(amount);
    if(isNaN(numericAmount) || numericAmount <= 0) {
        setError('Inserisci un importo valido e positivo.');
        setIsSubmitting(false);
        return;
    }

    try {
      const transactionData: any = {
        description,
        amount: numericAmount,
        type,
        category,
        accountId,
        date,
      };

      // Aggiungi toAccountId solo per i trasferimenti
      if (category === 'trasferimento') {
        transactionData.toAccountId = toAccountId;
      }

      await addTransaction(transactionData);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiunta della transazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Aggiungi nuova transazione</h2>
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {isAllView && (
        <div>
          <label htmlFor="person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona</label>
          <select id="person" value={txPersonId} onChange={e => setTxPersonId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        )}

        <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrizione</label>
        <div className="relative">
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} onBlur={handleDescriptionBlur} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" required />
          {isSuggesting && <SparklesIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-pulse" />}
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Importo</label>
          <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" required min="0.01" step="0.01" />
        </div>
         <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        </div>
        
         <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
          <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          <option value={TransactionType.SPESA}>Spesa</option>
          <option value={TransactionType.ENTRATA}>Entrata</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conto</label>
          <select id="account" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" required>
           {personAccounts.length > 0 ? (
            personAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
          ) : (
            <option value="" disabled>Nessun conto per questa persona</option>
          )}
          </select>
        </div>
        </div>

        {/* Campo per account di destinazione solo per trasferimenti */}
        {category === 'trasferimento' && (
          <div>
            <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account di Destinazione</label>
            <select 
              id="toAccount" 
              value={toAccountId} 
              onChange={e => setToAccountId(e.target.value)} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" 
              required
            >
              <option value="">Seleziona account di destinazione</option>
              {allPersonAccounts
                .filter(acc => acc.id !== accountId) // Escludi l'account di origine
                .map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))
              }
            </select>
          </div>
        )}

        <div className="flex justify-end pt-4 space-x-3">
        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors" disabled={isSubmitting}>Annulla</button>
        <button 
          type="submit" 
          className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Aggiunta...
          </>
          ) : (
          'Aggiungi transazione'
          )}
        </button>
        </div>
      </form>
      </div>
    </div>
  );
};