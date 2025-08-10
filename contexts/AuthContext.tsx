import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

// Tipizzazione forte per il context (principio Interface Segregation)
interface AuthUser {
  id: string;
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: () => void;
}

// Context con tipizzazione forte e valore di default
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook ottimizzato per accesso al context di autenticazione
 * Principio SRP: Singola responsabilità di fornire dati auth
 * Principio DIP: Dipende dall'astrazione del context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook per trasformare i dati utente Clerk in formato applicazione
 * Principio SRP: Single Responsibility - solo trasformazione dati
 */
const useAuthUser = (clerkUser: any): AuthUser | null => {
  return useMemo(() => {
    if (!clerkUser) return null;

    const emailAddress = clerkUser.primaryEmailAddress?.emailAddress || '';
    const firstName = clerkUser.firstName || undefined;
    const lastName = clerkUser.lastName || undefined;
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    return {
      id: clerkUser.id,
      emailAddress,
      firstName,
      lastName,
      imageUrl: clerkUser.imageUrl || undefined,
      fullName
    };
  }, [clerkUser]);
};

/**
 * Provider ottimizzato seguendo principi SOLID
 * - SRP: Gestisce solo l'autenticazione
 * - OCP: Estendibile per nuove funzionalità auth
 * - DIP: Dipende da astrazioni (Clerk hooks)
 * - DRY: Riutilizza logica comune
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, isSignedIn } = useClerkAuth();

  // Hook personalizzato per trasformazione utente
  const user = useAuthUser(clerkUser);

  // Callback memoizzato per sign in (principio DRY)
  const signIn = useCallback(() => {
    // Implementazione per sign in se necessaria
    console.log('Sign in functionality');
  }, []);

  // Memoizzazione completa del value per performance (principio DRY)
  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoaded,
    isSignedIn: isSignedIn || false,
    isLoading: !isLoaded,
    signOut,
    signIn,
  }), [user, isLoaded, isSignedIn, signOut, signIn]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};