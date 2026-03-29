/**
 * Dashboard Page - Server Component
 *
 * Uses request-scoped cached auth to avoid redundant database calls.
 * User and group data are cached per-request, shared with layout.
 */

import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import HomeContent from './home-content';
import HomePageLoading from './loading';

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const dashboardDataPromise = PageDataService.getDashboardData(currentUser.group_id || '').catch(
    (err) => {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento della dashboard';
      throw new Error(message, { cause: err });
    }
  );

  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomeContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        dashboardDataPromise={dashboardDataPromise}
      />
    </Suspense>
  );
}
