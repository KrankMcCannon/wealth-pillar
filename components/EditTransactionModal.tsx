import React, { useState, useEffect } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Transaction, TransactionType } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const { updateTransaction, accounts, categories, people, selectedPersonId } = useFinance();
  
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(transaction.date.split('T')[0]);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [toAccountId, setToAccountId] = useState(transaction.toAccountId || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAllView = selectedPersonId === 'all';
  const isTransfer = category === 'trasferimento';

  // Reset form when transaction changes
  useEffect(() => {
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setDate(transaction.date.split('T')[0]);
    setType(transaction.type);
    setCategory(transaction.category);
    setAccountId(transaction.accountId);
    setToAccountId(transaction.toAccountId || '');
    setError('');
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount.trim() || !date || !category || !accountId) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    if (isTransfer && !toAccountId) {
      setError('Seleziona l\'account di destinazione per il trasferimento');
      return;
    }

    if (isTransfer && accountId === toAccountId) {
      setError('L\'account di origine e destinazione devono essere diversi');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('L\'importo deve essere un numero positivo');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedTransaction: Transaction = {
        ...transaction,
        description: description.trim(),
        amount: numericAmount,
        date: date,
        type,
        category,
        accountId,
        toAccountId: isTransfer ? toAccountId : undefined,
      };

      await updateTransaction(updatedTransaction);
      onClose();
    } catch (err) {
      setError('Errore durante l\'aggiornamento della transazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Modifica Transazione
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrizione
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Importo (€)
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isTransfer} // I trasferimenti hanno sempre tipo "spesa"
            >
              <option value={TransactionType.ENTRATA}>Entrata</option>
              <option value={TransactionType.SPESA}>Spesa</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleziona categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isTransfer ? 'Account di origine' : 'Account'}
            </label>
            <select
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleziona account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {isTransfer && (
            <div>
              <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account di destinazione
              </label>
              <select
                id="toAccountId"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleziona account di destinazione</option>
                {accounts
                  .filter(acc => acc.id !== accountId)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
