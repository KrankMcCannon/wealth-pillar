import { memo, useCallback } from 'react';
import { useAuthCallback } from '../../hooks';
import { LoadingState, ErrorState } from '../ui';

/**
 * Componente per il successo dell'autenticazione
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
 * Pagina callback di autenticazione
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

  return <LoadingState message="Completamento autenticazione..." />;
});

AuthCallbackPage.displayName = 'AuthCallbackPage';
