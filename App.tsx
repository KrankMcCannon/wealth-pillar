import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common';
import { Dashboard, TransactionsPage, InvestmentsPage, SettingsPage, ReportsPage } from './components/pages';
import { AddTransactionModal } from './components/modals';
import { PlusIcon } from './components/common';
import { useFinance, FinanceProvider } from './hooks/core/useFinance';
import { useAuth } from './contexts/AuthContext';
import { SignIn } from '@clerk/clerk-react';

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { people, selectedPersonId, isLoading, error } = useFinance();

  const selectedPerson = people.find(p => p.id === selectedPersonId);
  const themeColor = selectedPerson?.themeColor || '#2563eb'; // Default to blue-600

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Errore di connessione</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Assicurati che il JSON Server sia in esecuzione
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div
        className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
        style={{ '--theme-color': themeColor } as React.CSSProperties}
      >
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: 'var(--theme-color)' }}
          className="fixed bottom-8 right-8 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-color)] dark:focus:ring-offset-gray-900"
          aria-label="Add new transaction"
        >
          <PlusIcon className="w-8 h-8" />
        </button>
        <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Wealth Pillar
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Accedi al tuo account
            </p>
          </div>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export default App;