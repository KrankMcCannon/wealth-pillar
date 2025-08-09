import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
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
  const { user, isLoaded } = useUser();
  const { signOut, isSignedIn } = useClerkAuth();

  const value = {
    user,
    isLoaded,
    isSignedIn: isSignedIn || false,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
