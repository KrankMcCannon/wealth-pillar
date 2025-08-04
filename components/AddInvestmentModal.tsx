import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../hooks/useFinance';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose }) => {
  const { addInvestment, people, selectedPersonId } = useFinance();

  const isAllView = selectedPersonId === 'all';

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState(isAllView ? (people[0]?.id || '') : selectedPersonId);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSymbol('');
      setQuantity('');
      setPurchasePrice('');
      setCurrentPrice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setError('');
      setIsSubmitting(false);
      setPersonId(isAllView ? (people[0]?.id || '') : selectedPersonId);
    }
  }, [isOpen, isAllView, people, selectedPersonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || !quantity || !purchasePrice || !currentPrice || !personId || !purchaseDate) {
      setError('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const numQuantity = parseFloat(quantity);
    const numPurchasePrice = parseFloat(purchasePrice);
    const numCurrentPrice = parseFloat(currentPrice);

    if (isNaN(numQuantity) || isNaN(numPurchasePrice) || isNaN(numCurrentPrice) || numQuantity <= 0 || numPurchasePrice <= 0 || numCurrentPrice < 0) {
      setError('Please enter valid, positive numbers for quantity and prices.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addInvestment({
        personId,
        name,
        symbol: symbol.toUpperCase(),
        quantity: numQuantity,
        purchasePrice: numPurchasePrice,
        currentPrice: numCurrentPrice,
        purchaseDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Aggiungi Nuovo Investimento</h2>
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">

          {isAllView && (
            <div>
              <label htmlFor="inv-person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona</label>
              <select id="inv-person" value={personId} onChange={e => setPersonId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Investimento</label>
              <input type="text" id="inv-name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label htmlFor="inv-symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Simbolo / Ticker</label>
              <input type="text" id="inv-symbol" value={symbol} onChange={e => setSymbol(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="inv-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantità</label>
              <input type="number" id="inv-quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required min="0" step="any" />
            </div>
            <div>
              <label htmlFor="inv-purchase-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prezzo di Acquisto</label>
              <input type="number" id="inv-purchase-price" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required min="0.01" step="0.01" />
            </div>
            <div>
              <label htmlFor="inv-current-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prezzo Attuale</label>
              <input type="number" id="inv-current-price" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required min="0" step="0.01" />
            </div>
          </div>

          <div>
            <label htmlFor="inv-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data di Acquisto</label>
            <input
              type="date"
              id="inv-date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors" disabled={isSubmitting}>Annulla</button>
            <button
              type="submit"
              style={{ backgroundColor: 'var(--theme-color)' }}
              className="py-2 px-4 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aggiunta in corso...
                </>
              ) : (
                'Aggiungi Investimento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};