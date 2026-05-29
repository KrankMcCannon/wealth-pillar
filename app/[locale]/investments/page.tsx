import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { InvestmentsSkeleton } from '@/components/ui/primitives/skeletons';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import { getInvestmentsOverviewUseCase } from '@/server/use-cases/investments/investment.use-cases';
import { getMarketDataUseCase } from '@/server/use-cases/market-data/market-data.use-cases';

export default async function InvestmentsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ currentUser, groupUsers }, t, searchParams] = await Promise.all([
    requirePageAuth(props.params),
    getTranslations('InvestmentsPage'),
    props.searchParams,
  ]);

  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'IVV';

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  const selectedUser = typeof searchParams.user === 'string' ? searchParams.user : 'all';
  const groupUserIds = groupUsers.map((u) => u.id);
  const targetUserIds = !isAdmin
    ? [currentUser.id]
    : selectedUser !== 'all' && groupUserIds.includes(selectedUser)
      ? [selectedUser]
      : groupUserIds.length > 0
        ? groupUserIds
        : [currentUser.id];

  const investmentsDataPromise = Promise.all([
    getInvestmentsOverviewUseCase(targetUserIds),
    withTimeout(
      getMarketDataUseCase(indexSymbol),
      1500,
      [] as Awaited<ReturnType<typeof getMarketDataUseCase>>
    ),
  ])
    .then(([overview, indexData]) => ({
      investments: overview.investments,
      summary: overview.summary,
      assetAllocation: overview.assetAllocation,
      portfolioHistory: overview.portfolioHistory,
      indexData,
      currentIndex: indexSymbol,
    }))
    .catch((err) => {
      const message = err instanceof Error ? err.message : t('loadError');
      throw new Error(message, { cause: err });
    });

  return (
    <Suspense fallback={<InvestmentsSkeleton />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        investmentsDataPromise={investmentsDataPromise}
      />
    </Suspense>
  );
}
