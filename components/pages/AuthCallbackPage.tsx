import React, { useEffect, useState, memo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState } from '../ui';

interface AuthCallbackState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook per gestire la logica del callback di autenticazione
 * Principio SRP: Single Responsibility - gestisce solo la logica del callback auth
 */
const useAuthCallback = () => {
  const [state, setState] = useState<AuthCallbackState>({
    loading: true,
    error: null,
    success: false,
  });
  const { user } = useAuth();

  const handleAuthCallback = useCallback(async () => {
    try {
      // Supabase gestisce automaticamente il callback OAuth
      // Verifica se l'URL contiene parametri di errore
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (errorParam) {
        setState({
          loading: false,
          error: errorDescription || 'Errore durante l\'autenticazione',
          success: false,
        });
        return;
      }

      // Attendi che l'utente sia caricato
      setTimeout(() => {
        if (user) {
          setState({
            loading: false,
            error: null,
            success: true,
          });
          // Reindirizza alla dashboard
          window.location.href = '/';
        } else {
          // Se non c'è utente dopo 3 secondi, c'è stato un errore
          setState({
            loading: false,
            error: 'Autenticazione non riuscita',
            success: false,
          });
        }
      }, 3000);

    } catch (err) {
      setState({
        loading: false,
        error: 'Si è verificato un errore durante l\'autenticazione',
        success: false,
      });
    }
  }, [user]);

  useEffect(() => {
    handleAuthCallback();
  }, [handleAuthCallback]);

  return state;
};

/**
 * Componente per il successo dell'autenticazione
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione del successo
 */
const AuthSuccessState = memo(() => (
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
));

AuthSuccessState.displayName = 'AuthSuccessState';

/**
 * Pagina callback di autenticazione ottimizzata
 * Principio SRP: Single Responsibility - gestisce solo la logica di callback
 * Principio OCP: Open/Closed - estendibile per altri provider auth
 */
export const AuthCallbackPage = memo(() => {
  const { loading, error, success } = useAuthCallback();

  const handleRetryAuth = useCallback(() => {
    window.location.href = '/auth';
  }, []);

  if (loading) {
    return <LoadingState message="Completamento autenticazione..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Errore di autenticazione"
        message={error}
        onRetry={handleRetryAuth}
        retryLabel="Torna al login"
      />
    );
  }

  if (success) {
    return <AuthSuccessState />;
  }

  // Fallback state (shouldn't reach here)
  return <LoadingState message="Completamento autenticazione..." />;
});

AuthCallbackPage.displayName = 'AuthCallbackPage';
