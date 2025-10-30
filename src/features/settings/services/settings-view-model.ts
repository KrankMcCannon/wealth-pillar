/**
 * Settings View Model
 * Transforms raw settings data into ready-for-UI structured data
 * Follows MVVM pattern - separates complex calculations from presentation
 */

import { Account, User, Transaction, RoleType } from '@/src/lib';

/**
 * User display information for settings
 */
export interface UserDisplayInfo {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  createdAt: string;
}

/**
 * Activity statistics for current user
 */
export interface ActivityStats {
  accountCount: number;
  transactionCount: number;
}

/**
 * Plan information for current user
 */
export interface PlanInfo {
  name: string;
  color: string;
  bgColor: string;
}

/**
 * Complete Settings View Model
 */
export interface SettingsViewModel {
  currentUser: User | null;
  users: UserDisplayInfo[];
  activityStats: ActivityStats;
  planInfo: PlanInfo;
}

/**
 * Create Settings View Model
 * Transform raw data into view model ready for UI
 *
 * @param currentUser - Current authenticated user
 * @param allUsers - All users in the group
 * @param accounts - All accessible accounts
 * @param transactions - All accessible transactions
 * @returns Complete view model for settings
 */
export function createSettingsViewModel(
  currentUser: User | null,
  allUsers: User[],
  accounts: Account[],
  transactions: Transaction[]
): SettingsViewModel {
  // ========================================
  // Transform users to display format
  // ========================================
  const userDisplays: UserDisplayInfo[] = allUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt:
      typeof user.created_at === 'string' ? user.created_at : user.created_at?.toISOString?.() || '',
  }));

  // ========================================
  // Calculate activity stats
  // ========================================
  const activityStats: ActivityStats = (() => {
    if (!currentUser) return { accountCount: 0, transactionCount: 0 };

    const userAccounts = accounts.filter(account =>
      account.user_ids.includes(currentUser.id)
    );
    const userTransactions = transactions.filter(transaction => transaction.user_id === currentUser.id);

    return {
      accountCount: userAccounts.length,
      transactionCount: userTransactions.length,
    };
  })();

  // ========================================
  // Determine plan information
  // ========================================
  const planInfo: PlanInfo = (() => {
    if (!currentUser?.group_id) {
      return {
        name: 'Base Plan',
        color: 'text-primary/70',
        bgColor: 'bg-gray-100',
      };
    }
    return {
      name: 'Premium Plan',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    };
  })();

  // ========================================
  // Assemble view model
  // ========================================
  return {
    currentUser,
    users: userDisplays,
    activityStats,
    planInfo,
  };
}

/**
 * Create empty settings view model
 * Used when no data is available
 */
export function createEmptySettingsViewModel(): SettingsViewModel {
  return {
    currentUser: null,
    users: [],
    activityStats: {
      accountCount: 0,
      transactionCount: 0,
    },
    planInfo: {
      name: 'Base Plan',
      color: 'text-primary/70',
      bgColor: 'bg-gray-100',
    },
  };
}
