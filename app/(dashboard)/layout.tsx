import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { GroupService, UserService, AccountService, CategoryService } from '@/server/services';
import type { User } from '@/lib/types';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';
import { UserProvider } from '@/providers/user-provider';

/**
 * Dashboard Layout with Zustand Store Initialization
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

  // Step 3: Check group logic
  if (!user.group_id) {
    // If user has no group configured, maybe redirect to an onboarding step or handle gracefully
    // For now, let's assume valid state but with empty lists
    return (
      <NuqsAdapter>
        <UserProvider currentUser={user as unknown as User} groupUsers={[user as unknown as User]}>
          {children}
        </UserProvider>
      </NuqsAdapter>
    );
  }

  // Step 4: Parallel data fetching
  const [groupUsersResult, accountsResult, categoriesResult] = await Promise.all([
    GroupService.getGroupUsers(user.group_id),
    AccountService.getAccountsByGroup(user.group_id),
    CategoryService.getAllCategories(),
  ]);

  const groupUsers = groupUsersResult.data || [];
  const accounts = accountsResult.data || [];
  const categories = categoriesResult.data || [];


  return (
    <NuqsAdapter>
      <UserProvider currentUser={user as unknown as User} groupUsers={(groupUsers || []) as unknown as User[]}>
        <ReferenceDataInitializer
          data={{
            accounts,
            categories,
          }}
        >
          <ModalProvider>
            {children}
          </ModalProvider>
        </ReferenceDataInitializer>
      </UserProvider>
    </NuqsAdapter>
  );
}
