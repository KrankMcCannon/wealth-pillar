import React, { useState, useEffect } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Account } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, account }) => {
  const { updateAccount, people } = useFinance();
  const [name, setName] = useState('');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setSelectedPersonIds(account.personIds || []);
      setError('');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name cannot be empty.');
      return;
    }
    if (selectedPersonIds.length === 0) {
      setError('Please select at least one person for this account.');
      return;
    }
    if (account) {
      setIsSubmitting(true);
      setError('');
      try {
        await updateAccount({ ...account, name, personIds: selectedPersonIds });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update account');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePersonToggle = (personId: string) => {
    setSelectedPersonIds(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Modifica Conto</h2>
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Conto</label>
        <input 
          type="text" 
          id="account-name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" 
          required 
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Persone Associate</label>
        <div className="space-y-2">
          {people.map(person => (
          <label key={person.id} className="flex items-center">
            <input
            type="checkbox"
            checked={selectedPersonIds.includes(person.id)}
            onChange={() => handlePersonToggle(person.id)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600 dark:checked:border-blue-600"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">{person.name}</span>
          </label>
          ))}
        </div>
        </div>

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
            Salvataggio...
          </>
          ) : (
          'Salva Modifiche'
          )}
        </button>
        </div>
      </form>
      </div>
    </div>
  );
};
