/**
 * Dashboard Page - Server Component
 *
 * Uses request-scoped cached auth to avoid redundant database calls.
 * User and group data are cached per-request, shared with layout.
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getDashboardPageData } from '@/server/use-cases';
import HomeContent from './home-content';
import HomePageLoading from './loading';

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const [{ currentUser, groupUsers }, t] = await Promise.all([
    requirePageAuth(params),
    getTranslations('HomePage'),
  ]);
  // requireGroupId needs currentUser so it runs after the parallel wave resolves.
  const groupId = await requireGroupId(currentUser);

  const dashboardDataPromise = getDashboardPageData(groupId, currentUser).catch((err) => {
    const message = err instanceof Error ? err.message : t('loadError');
    throw new Error(message, { cause: err });
  });

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
