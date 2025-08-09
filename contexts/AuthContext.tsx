import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  
  // Passwordless OTP methods
  signInWithOTP: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  
  // OAuth methods
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  
  // User management
  linkOTPToAccount: () => Promise<{ error: AuthError | null }>;
  updateUserPassword: (password: string) => Promise<{ error: AuthError | null }>;
  getUserProviders: () => Promise<string[]>;
  getAvailableProviders: () => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    let mounted = true;
    
    // Ottieni la sessione iniziale
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Ascolta i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Assicurati che il loading sia false quando c'è un cambio di stato
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      // Non impostare loading a false qui - lascia che onAuthStateChange lo gestisca
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Non impostare loading a false qui - lascia che onAuthStateChange lo gestisca
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Passwordless OTP methods
  const signInWithOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      // Non impostare loading a false qui - lascia che onAuthStateChange lo gestisca
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err as AuthError };
    }
  };

  // OAuth methods
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  // User management
  const linkOTPToAccount = async () => {
    try {
      // OTP è già disponibile per tutti gli utenti Supabase
      return { error: null };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    });
    return { error };
  };

  const getUserProviders = async (): Promise<string[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const providers: string[] = [];
      
      // Verifica i provider realmente usati dall'utente
      if (user.app_metadata?.providers) {
        user.app_metadata.providers.forEach((provider: string) => {
          if (provider === 'email') {
            // Se l'utente si è registrato con email/password
            if (user.user_metadata?.password_set !== false) {
              providers.push('password');
            }
            // Se l'utente si è registrato solo con OTP (senza password)
            if (user.user_metadata?.password_set === false || 
                user.email_confirmed_at && !user.user_metadata?.password_set) {
              providers.push('otp');
            }
          } else {
            // Provider OAuth (google, github, etc.)
            providers.push(provider);
          }
        });
      }
      
      // Caso speciale: se l'utente ha una password ma non è nei provider, aggiungila
      if (user.user_metadata?.password_set && !providers.includes('password')) {
        providers.push('password');
      }
      
      return [...new Set(providers)]; // Rimuovi duplicati
    } catch (error) {
      console.error('Error getting user providers:', error);
      return [];
    }
  };

  const getAvailableProviders = async (): Promise<string[]> => {
    try {
      const currentProviders = await getUserProviders();
      const allPossibleProviders = ['password', 'otp'];
      
      // Restituisci solo i provider che non sono già attivi
      return allPossibleProviders.filter(provider => !currentProviders.includes(provider));
    } catch (error) {
      console.error('Error getting available providers:', error);
      return [];
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOTP,
    verifyOTP,
    signInWithGoogle,
    linkOTPToAccount,
    updateUserPassword,
    getUserProviders,
    getAvailableProviders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
