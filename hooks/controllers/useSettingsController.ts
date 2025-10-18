/**
 * Settings Controller Hook
 * Extracts ALL business logic from settings/page.tsx
 * Follows MVC pattern established in useTransactionsController
 *
 * Responsibilities:
 * 1. Data fetching (user data, accounts, transactions)
 * 2. Activity stats calculation
 * 3. Plan information
 * 4. Action handlers (signout, navigation)
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts, useTransactions, useUserSelection } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';

/**
 * Activity statistics
 */
interface ActivityStats {
  accountCount: number;
  transactionCount: number;
}

/**
 * Plan information
 */
interface PlanInfo {
  name: string;
  color: string;
  bgColor: string;
}

export function useSettingsController() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // ========================================
  // DATA FETCHING
  // ========================================
  const {
    currentUser,
    users: rawUsers,
    isLoading: usersLoading,
    userStats,
  } = useUserSelection();

  // ========================================
  // COMPUTED DATA
  // ========================================

  // Sort users by role: superadmin -> admin -> member
  const users = useMemo(() => {
    const roleOrder = { superadmin: 0, admin: 1, member: 2 };
    return [...rawUsers].sort((a, b) => {
      const aOrder = roleOrder[a.role] ?? 3;
      const bOrder = roleOrder[b.role] ?? 3;
      return aOrder - bOrder;
    });
  }, [rawUsers]);

  // Calculate activity stats
  const activityStats: ActivityStats = useMemo(() => {
    if (!currentUser) return { accountCount: 0, transactionCount: 0 };

    const userAccounts = accounts.filter(account =>
      account.user_ids.includes(currentUser.id)
    );
    const userTransactions = transactions.filter(transaction =>
      transaction.user_id === currentUser.id
    );

    return {
      accountCount: userAccounts.length,
      transactionCount: userTransactions.length
    };
  }, [currentUser, accounts, transactions]);

  // Determine plan information
  const planInfo: PlanInfo = useMemo(() => {
    if (!currentUser?.group_id) {
      return {
        name: 'Base Plan',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
    }
    return {
      name: 'Premium Plan',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    };
  }, [currentUser?.group_id]);

  // ========================================
  // LOADING STATE
  // ========================================
  const isLoading = usersLoading;

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      // Wait for Clerk to complete sign-out before redirecting
      await signOut();
      // Add small delay to ensure Clerk's session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      // Navigate to sign-in page
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  }, [signOut]);

  // ========================================
  // RETURN API
  // ========================================
  return {
    // Raw Data
    currentUser,
    users,
    userStats,

    // Computed Data
    activityStats,
    planInfo,

    // State
    isSigningOut,

    // Loading State
    isLoading,

    // Actions
    handleBackClick,
    handleSignOut,
  };
}
