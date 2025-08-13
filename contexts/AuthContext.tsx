import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ServiceError } from '../lib/supabase/services/base-service';

/**
 * Type Definitions (Interface Segregation Principle)
 */
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

/**
 * User Transformation Utilities (DRY & SRP Principles)
 * Single Responsibility: Only handles user data transformation
 */
class UserTransformationService {
  /**
   * Transform Clerk user to internal AuthUser format
   * Follows SRP: single transformation responsibility
   */
  static transformClerkUser(clerkUser: any): AuthUser | null {
    if (!clerkUser) return null;

    try {
      const emailAddress = clerkUser.primaryEmailAddress?.emailAddress || '';
      const firstName = clerkUser.firstName || undefined;
      const lastName = clerkUser.lastName || undefined;
      const fullName = this.buildFullName(firstName, lastName);

      return {
        id: clerkUser.id,
        emailAddress,
        firstName,
        lastName,
        imageUrl: clerkUser.imageUrl || undefined,
        fullName
      };
    } catch (error) {
      throw new ServiceError(
        'Failed to transform user data',
        'USER_TRANSFORMATION_ERROR',
        error as Error
      );
    }
  }

  /**
   * Build full name with proper null handling
   * Follows SRP: single name building responsibility
   */
  private static buildFullName(firstName?: string, lastName?: string): string | undefined {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  /**
   * Validate user data integrity
   * Follows SRP: single validation responsibility
   */
  static validateUser(user: AuthUser): boolean {
    return !!(user?.id && user?.emailAddress);
  }
}

/**
 * Context Creation with strong typing
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Custom Hook for accessing Auth Context (SRP & DIP Principles)
 * Single Responsibility: Only provides auth context access
 * Dependency Inversion: Depends on AuthContext abstraction
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Custom Hook for User Transformation (SRP Principle)
 * Single Responsibility: Only transforms Clerk user data
 */
const useAuthUser = (clerkUser: any): AuthUser | null => {
  return useMemo(() => UserTransformationService.transformClerkUser(clerkUser), [clerkUser]);
};

/**
 * Auth Provider optimized with SOLID principles
 * - SRP: Manages only authentication state
 * - OCP: Extensible for new auth features
 * - DIP: Depends on Clerk abstractions
 * - DRY: Reuses common auth logic
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, isSignedIn } = useClerkAuth();

  // Transform user data using custom hook (SRP principle)
  const user = useAuthUser(clerkUser);

  // Memoized sign-in callback (DRY principle)
  const signIn = useCallback(() => {
    // Implementation for sign in if needed
    console.log('Sign in functionality');
  }, []);

  // Memoized context value for performance optimization (DRY principle)
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