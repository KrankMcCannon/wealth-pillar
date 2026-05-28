import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { InvestmentsSkeleton } from '@/components/ui/primitives/skeletons';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import {
  getPortfolioUseCase,
  getHistoricalPortfolioUseCase,
} from '@/server/use-cases/investments/investment.use-cases';
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

  const investmentsDataPromise = Promise.all([
    getPortfolioUseCase(currentUser.id),
    getHistoricalPortfolioUseCase(currentUser.id),
    withTimeout(
      getMarketDataUseCase(indexSymbol),
      1500,
      [] as Awaited<ReturnType<typeof getMarketDataUseCase>>
    ),
  ])
    .then(([portfolioData, portfolioHistory, indexData]) => ({
      investments: portfolioData.investments,
      summary: portfolioData.summary,
      assetAllocation: portfolioData.assetAllocation,
      portfolioHistory,
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
