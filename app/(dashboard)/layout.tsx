import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';

/**
 * Dashboard Layout with Zustand Store Initialization
 *
 * Server Component that fetches shared data and initializes global stores:
 * - ReferenceDataInitializer: Initializes reference data store (users, accounts, categories)
 * - ModalProvider: Manages global modals via URL state (nuqs)
 *
 * Architecture:
 * - Server Component for optimal data fetching
 * - Fetches user data and page data once at layout level
 * - ReferenceDataInitializer bridges server data → Zustand stores
 * - ModalProvider reads from stores (no props needed)
 * - User filter state managed globally via Zustand (client-side)
 *
 * Data Flow:
 * Layout (Server) → Fetch Data → ReferenceDataInitializer (Client) → Stores → ModalProvider (Client) → Children
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
      <ReferenceDataInitializer
        data={{
          currentUser,
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
