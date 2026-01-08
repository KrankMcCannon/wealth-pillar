import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserService, GroupService } from '@/lib/services';
import type { User } from '@/lib/types';

/**
 * Dashboard Data Response
 * Contains user and group information for dashboard pages
 */
export interface DashboardData {
  currentUser: User;
  groupUsers: User[];
}

/**
 * Get Dashboard Data
 *
 * Shared utility function to fetch user and group data for dashboard pages.
 * This function encapsulates the common pattern used across all dashboard pages:
 * 1. Authenticate user with Clerk
 * 2. Fetch logged user info from database
 * 3. Fetch all users in the same group
 *
 * **Benefits:**
 * - DRY principle - Single source of truth for data fetching logic
 * - Consistent error handling across all pages
 * - Automatic caching (user: 5min, group: 10min)
 * - Type safety with TypeScript
 *
 * **Usage:**
 * ```typescript
 * // In any dashboard page.tsx
 * import { getDashboardData } from '@/lib/auth/get-dashboard-data';
 *
 * export default async function MyPage() {
 *   const { currentUser, groupUsers } = await getDashboardData();
 *
 *   return (
 *     <PageContent currentUser={currentUser} groupUsers={groupUsers} />
 *   );
 * }
 * ```
 *
 * **Error Handling:**
 * - Redirects to /auth if user is not authenticated
 * - Redirects to /auth if user data cannot be fetched
 * - Logs error if group users fail to load (but continues with empty array)
 *
 * @returns Promise<DashboardData> - User and group data
 * @throws Redirects to /auth on authentication failure
 *
 * @example
 * const { currentUser, groupUsers } = await getDashboardData();
 * console.log(currentUser.name); // "John Doe"
 * console.log(groupUsers.length); // 3
 */
export async function getDashboardData(): Promise<DashboardData> {
  // Step 1: Authenticate user with Clerk
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/auth');
  }

  // Step 2: Fetch logged user info from database (cached for 5 minutes)
  const { data: user, error: userError } = await UserService.getLoggedUserInfo(clerkId);

  // If user doesn't exist in Supabase, redirect to auth
  // User will be created during onboarding flow
  if (userError || !user) {
    redirect('/auth');
  }

  // Step 3: Fetch all users in the group (cached for 10 minutes)
  const { data: groupUsers, error: groupError } = await GroupService.getGroupUsers(user.group_id);

  if (groupError) {
    // Log error but don't block page render
    // Some features may be limited without group users
    console.error('Failed to load group users:', groupError);
  }

  // Return data with fallback for group users
  return {
    currentUser: user,
    groupUsers: groupUsers || [],
  };
}

/**
 * Dashboard Data Props
 * Standard props interface for dashboard content components
 *
 * Use this interface in your content components for type safety
 *
 * @example
 * interface MyContentProps extends DashboardDataProps {
 *   // Add any additional props specific to your component
 *   extraProp?: string;
 * }
 */
export interface DashboardDataProps {
  currentUser: User;
  groupUsers: User[];
}
