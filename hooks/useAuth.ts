'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { AuthUser, getUserByClerkId, createUserInDatabase } from '@/lib/auth';

export interface UseAuthReturn {
  // User data
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Clerk auth functions
  signOut: () => void;

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
            let user = await getUserByClerkId(clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress);

            // If user doesn't exist, try to create it in Supabase
            if (!user) {
              user = await createUserInDatabase({
                clerk_id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                name: clerkUser.firstName && clerkUser.lastName
                  ? `${clerkUser.firstName} ${clerkUser.lastName}`
                  : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'User',
                avatar: clerkUser.imageUrl || '',
              });
            }

            // If user doesn't exist in database, create a fallback user
            if (!user) {
              const now = new Date().toISOString();
              user = {
                id: clerkUser.id,
                clerk_id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                name: clerkUser.firstName && clerkUser.lastName
                  ? `${clerkUser.firstName} ${clerkUser.lastName}`
                  : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'User',
                avatar: clerkUser.imageUrl || '',
                role: 'member',
                created_at: now,
                updated_at: now,
              };
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
  const signOut = () => {
    setAuthUser(null);
    clerkSignOut();
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
