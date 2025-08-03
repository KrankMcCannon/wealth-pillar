import React, { useState, useEffect } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Person } from '../types';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({ isOpen, onClose, person }) => {
  const { updatePerson } = useFinance();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [themeColor, setThemeColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  useEffect(() => {
    if (person) {
      setName(person.name);
      setAvatar(person.avatar);
      setThemeColor(person.themeColor);
      setError('');
    }
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Person name cannot be empty.');
      return;
    }
    if (person) {
      setIsSubmitting(true);
      setError('');
      try {
        await updatePerson({ ...person, name, avatar, themeColor });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update person');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Modifica Profilo</h2>
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label htmlFor="person-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome completo</label>
        <input 
          type="text" 
          id="person-name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" 
          required 
        />
        </div>
        <div>
        <label htmlFor="person-avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Avatar</label>
        <input 
          type="text" 
          id="person-avatar" 
          value={avatar} 
          onChange={e => setAvatar(e.target.value)} 
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"
        />
        </div>
        <div>
        <label htmlFor="person-theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Colore Tema</label>
        <div className="flex items-center mt-1">
          <input 
            type="color" 
            id="person-theme" 
            value={themeColor} 
            onChange={e => setThemeColor(e.target.value)} 
            className="p-1 h-10 w-14 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-lg"
          />
          <input
            type="text"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            className="ml-2 w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"
          />
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
          'Salva modifiche'
          )}
        </button>
        </div>
      </form>
      </div>
    </div>
  );
};