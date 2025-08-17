import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../core/useFinance';

interface OnboardingState {
  isLoading: boolean;
  needsOnboarding: boolean;
  error: string | null;
}

/**
 * Hook per gestire lo stato dell'onboarding dell'app
 * Principio SRP: Single Responsibility - gestisce solo la logica di stato onboarding
 */
export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    isLoading: true,
    needsOnboarding: false,
    error: null,
  });

  const { user, isSignedIn } = useAuth();
  const { people, isLoading: financeLoading, error: financeError } = useFinance();

  /**
   * Controlla se l'utente ha bisogno dell'onboarding
   * Usa i dati già caricati da useFinance per evitare chiamate duplicate
   */
  const checkOnboardingNeed = useCallback(() => {
    if (!isSignedIn || !user) {
      setState({
        isLoading: false,
        needsOnboarding: false,
        error: null,
      });
      return;
    }

    // Se ci sono errori di caricamento, non mostrare onboarding
    if (financeError) {
      setState({
        isLoading: false,
        needsOnboarding: false,
        error: financeError,
      });
      return;
    }

    // Se stiamo ancora caricando, aspetta
    if (financeLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    // Controlla se l'utente ha persone associate (quindi ha completato l'onboarding)
    const needsOnboarding = !people || people.length === 0;

    setState({
      isLoading: false,
      needsOnboarding,
      error: null,
    });
  }, [isSignedIn, user, people, financeLoading, financeError]);

  /**
   * Completa l'onboarding
   */
  const completeOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      needsOnboarding: false,
    }));
  }, []);

  // Controlla il bisogno di onboarding quando cambia lo stato dell'autenticazione o dei dati
  useEffect(() => {
    if (!financeLoading) {
      checkOnboardingNeed();
    }
  }, [checkOnboardingNeed, financeLoading]);

  return {
    ...state,
    checkOnboardingNeed,
    completeOnboarding,
  };
};
