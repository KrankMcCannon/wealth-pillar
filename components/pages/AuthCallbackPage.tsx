import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase gestisce automaticamente il callback OAuth
        // Verifica se l'URL contiene parametri di errore
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || 'Errore durante l\'autenticazione');
          setLoading(false);
          return;
        }

        // Attendi che l'utente sia caricato
        setTimeout(() => {
          if (user) {
            // Reindirizza alla dashboard
            window.location.href = '/';
          } else {
            // Se non c'è utente dopo 3 secondi, c'è stato un errore
            setError('Autenticazione non riuscita');
          }
          setLoading(false);
        }, 3000);

      } catch (err) {
        setError('Si è verificato un errore durante l\'autenticazione');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Completamento autenticazione...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
              Errore di autenticazione
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Torna al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">
            Autenticazione riuscita!
          </h2>
          <p className="text-green-600 dark:text-green-300">
            Reindirizzamento in corso...
          </p>
        </div>
      </div>
    </div>
  );
};
