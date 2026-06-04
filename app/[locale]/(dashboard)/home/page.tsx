/**
 * Dashboard Page - Server Component
 *
 * Auth and data resolve inside Suspense so the persistent dashboard shell renders immediately.
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getDashboardPageData } from '@/server/use-cases';
import HomeContent from './home-content';
import HomePageLoading from './loading';

async function HomePageData({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const [{ currentUser, groupUsers, groupId }, t] = await Promise.all([
    resolvePageContext(params),
    getTranslations('HomePage'),
  ]);

  const dashboardDataPromise = getDashboardPageData(groupId, currentUser).catch((err) => {
    const message = err instanceof Error ? err.message : t('loadError');
    throw new Error(message, { cause: err });
  });

  return (
    <HomeContent
      currentUser={currentUser}
      groupUsers={groupUsers}
      dashboardDataPromise={dashboardDataPromise}
    />
  );
}

export default function HomePage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageData params={params} />
    </Suspense>
  );
}
