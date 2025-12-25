import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import { ModalProvider } from '@/providers/modal-provider';

/**
 * Dashboard Layout with Modal Management
 *
 * Server Component that fetches shared data and provides it to:
 * - All dashboard pages (via children)
 * - Global modal system (via ModalProvider)
 *
 * Architecture:
 * - Server Component for optimal data fetching
 * - Fetches user data and page data once at layout level
 * - ModalProvider manages all modals via URL state (nuqs)
 * - User filter state managed globally via Zustand (client-side)
 *
 * Data Flow:
 * Layout (Server) → Fetch Data → ModalProvider (Client) → Children
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user data (currentUser, groupUsers)
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch page data (accounts, categories, etc.)
  const { data } = await PageDataService.getDashboardData(currentUser.group_id);

  // Safe fallbacks if data is null
  const { accounts = [], categories = [] } = data || {};

  return (
    <NuqsAdapter>
      <ModalProvider
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={currentUser.group_id}
      >
        {children}
      </ModalProvider>
    </NuqsAdapter>
  );
}
