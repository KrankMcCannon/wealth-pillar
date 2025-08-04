import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount, people } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'cash' | 'investment'>('checking');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setType('checking');
    setSelectedPersonIds([]);
    setError('');
    setIsSubmitting(false);
  };

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

    setIsSubmitting(true);
    setError('');
    try {
      await addAccount({
        name: name.trim(),
        type,
        personIds: selectedPersonIds,
        balance: 0 // Default balance
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonToggle = (personId: string) => {
    setSelectedPersonIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 transform transition-all max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Aggiungi nuovo conto</h2>
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome conto</label>
            <input
              type="text"
              id="account-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="es: Conto Risparmio Condiviso"
            />
          </div>

          <div>
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo conto</label>
            <select
              id="account-type"
              value={type}
              onChange={e => setType(e.target.value as typeof type)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="stipendio">Stipendio</option>
              <option value="risparmi">Risparmi</option>
              <option value="contanti">Contanti</option>
              <option value="investimenti">Investimenti</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Persone associate</label>
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
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aggiunta in corso...
                </>
              ) : (
                'Aggiungi conto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
