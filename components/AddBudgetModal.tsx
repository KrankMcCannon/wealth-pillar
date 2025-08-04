import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose, personId }) => {
  const { addBudget, categories } = useFinance();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setSelectedCategories([]);
    setError('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description cannot be empty.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await addBudget({
        description: description.trim(),
        amount: parseFloat(amount),
        categories: selectedCategories,
        period: 'monthly',
        personId
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl m-4 transform transition-all max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Aggiungi Nuovo Budget</h2>
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="budget-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrizione</label>
            <input
              type="text"
              id="budget-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="es: Spese Essenziali, Intrattenimento, Cura Personale"
            />
          </div>

          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Importo Mensile (€)</label>
            <input
              type="number"
              id="budget-amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categorie Associate</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
              {categories
                .filter(cat => !['stipendio', 'investimenti', 'entrata', 'trasferimento'].includes(cat.id))
                .map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600 dark:checked:border-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                  </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selezionate: {selectedCategories.length} categorie
            </p>
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
                'Aggiungi Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
