import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface AuthCallbackState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook per gestire la logica del callback di autenticazione
 * Principio SRP: Single Responsibility - gestisce solo la logica del callback auth
 * Principio DRY: Don't Repeat Yourself - centralizza la logica di callback
 */
export const useAuthCallback = () => {
  const [state, setState] = useState<AuthCallbackState>({
    loading: true,
    error: null,
    success: false,
  });
  const { user } = useAuth();

  /**
   * Gestisce il processo di callback di autenticazione
   * Principio SRP: Single Responsibility - gestisce solo il callback
   */
  const handleAuthCallback = useCallback(async () => {
    try {
      // Verifica se l'URL contiene parametri di errore
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (errorParam) {
        setState({
          loading: false,
          error: errorDescription || "Errore durante l'autenticazione",
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
          // Reindirizza alla home
          window.location.href = "/";
        } else {
          // Se non c'è utente dopo 3 secondi, c'è stato un errore
          setState({
            loading: false,
            error: "Autenticazione non riuscita",
            success: false,
          });
        }
      }, 3000);
    } catch (err) {
      setState({
        loading: false,
        error: "Errore durante l'autenticazione",
        success: false,
      });
    }
  }, [user]);

  // Avvia il processo di callback quando il componente si monta
  useEffect(() => {
    handleAuthCallback();
  }, [handleAuthCallback]);

  return {
    ...state,
    retry: handleAuthCallback,
  };
};
