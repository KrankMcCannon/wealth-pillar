import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { GroupService, PageDataService, UserService } from '@/lib/services';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';

/**
 * Dashboard Layout with Zustand Store Initialization
 *
 * Server Component that fetches shared data and initializes global stores:
 * - ReferenceDataInitializer: Initializes reference data store (users, accounts, categories)
 * - ModalProvider: Manages global modals via URL state (nuqs)
 *
 * Architecture (Next.js 16 Best Practices):
 * - Auth Gatekeeper: Checks Clerk auth AND Supabase user existence
 * - Server Component for optimal data fetching with parallel queries
 * - ReferenceDataInitializer bridges server data → Zustand stores
 * - ModalProvider reads from stores (no props needed)
 * - User filter state managed globally via Zustand (client-side)
 *
 * Auth Flow:
 * 1. Check Clerk auth → redirect to /auth if missing
 * 2. Check Supabase user → redirect to /auth/sso-callback if missing (for onboarding)
 * 3. Fetch data in parallel → initialize stores
 *
 * Data Flow:
 * Layout (Server) → Fetch Data → ReferenceDataInitializer (Client) → Stores → ModalProvider (Client) → Children
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Check Clerk authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/auth');
  }

  // Step 2: Check if user exists in Supabase
  const { data: user, error } = await UserService.getLoggedUserInfo(clerkId);

  // If user doesn't exist in Supabase, redirect to SSO callback for onboarding
  if (error || !user) {
    redirect('/auth/sso-callback');
  }

  // Step 3: Parallel data fetching (PERFORMANCE OPTIMIZATION)
  // Fetch group users and page data simultaneously instead of sequentially
  const [groupUsersResult, pageDataResult] = await Promise.all([
    GroupService.getGroupUsers(user.group_id),
    PageDataService.getDashboardData(user.group_id),
  ]);

  const groupUsers = groupUsersResult.data || [];
  const { accounts = [], categories = [] } = pageDataResult.data || {};

  return (
    <NuqsAdapter>
      <ReferenceDataInitializer
        data={{
          currentUser: user,
          groupUsers,
          accounts,
          categories,
        }}
      >
        <ModalProvider>
          {children}
        </ModalProvider>
      </ReferenceDataInitializer>
    </NuqsAdapter>
  );
}
