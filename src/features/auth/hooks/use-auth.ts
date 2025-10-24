'use client';

import { AuthUser, getUserByClerkId } from '@/src/lib';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export interface UseAuthReturn {
  // User data
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Clerk auth functions
  signOut: () => Promise<void>;

  // Role checking
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMember: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch auth user data when Clerk user changes
  useEffect(() => {
    const fetchAuthUser = async () => {
      if (clerkLoaded) {
        if (clerkUser) {
          try {
            // Try to get existing user from Supabase (by clerk_id or email)
            const user = await getUserByClerkId(clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress);

            // If user doesn't exist, they need to complete onboarding first
            if (!user) {
              console.warn('User not found in database. User needs to complete onboarding.');
              setAuthUser(null);
              setIsLoading(false);
              return;
            }

            setAuthUser(user);
          } catch (error) {
            console.error('Error fetching auth user:', error);
            setAuthUser(null);
          }
        } else {
          setAuthUser(null);
        }
        setIsLoading(false);
      }
    };

    fetchAuthUser();
  }, [clerkUser, clerkLoaded]);

  // Permission checks are centralized in usePermissions; kept minimal here.

  // Sign out function that clears both Clerk and local state
  const signOut = async () => {
    setAuthUser(null);
    await clerkSignOut();
  };

  return {
    user: authUser,
    isAuthenticated: !!authUser,
    isLoading: isLoading || !clerkLoaded,
    signOut,
    isAdmin: authUser?.role === 'admin' || authUser?.role === 'superadmin',
    isSuperAdmin: authUser?.role === 'superadmin',
    isMember: authUser?.role === 'member',
  };
};
