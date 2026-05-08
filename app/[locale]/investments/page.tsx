import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { InvestmentsSkeleton } from '@/components/investments/investments-skeleton';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import { getPortfolioUseCase } from '@/server/use-cases/investments/investment.use-cases';
import { getMarketDataUseCase } from '@/server/use-cases/market-data/market-data.use-cases';
import { getPopularSharesUseCase } from '@/server/use-cases/investments/available-shares.use-cases';

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
    withTimeout(
      getMarketDataUseCase(indexSymbol),
      1500,
      [] as Awaited<ReturnType<typeof getMarketDataUseCase>>
    ),
    getPopularSharesUseCase(),
  ])
    .then(([portfolioData, indexData, popularShares]) => {
      // Fetch latest prices for popular shares to populate watchlist
      const watchlistPromises = popularShares.map(async (share) => {
        try {
          const marketData = await getMarketDataUseCase(share.symbol);
          const latestPrice =
            marketData && marketData.length > 0
              ? Number(marketData[marketData.length - 1]?.close)
              : undefined;
          let changePercent: number | undefined;
          if (marketData && marketData.length > 1) {
            const prevPrice = Number(marketData[marketData.length - 2]?.close);
            if (prevPrice > 0 && latestPrice !== undefined) {
              changePercent = ((latestPrice - prevPrice) / prevPrice) * 100;
            }
          }
          return {
            id: share.id,
            symbol: share.symbol,
            name: share.name,
            assetType: share.asset_type,
            price: latestPrice,
            changePercent,
            currency: share.currency || 'USD',
          };
        } catch {
          return {
            id: share.id,
            symbol: share.symbol,
            name: share.name,
            assetType: share.asset_type,
            currency: share.currency || 'USD',
          };
        }
      });
      return Promise.all(watchlistPromises).then((watchlist) => ({
        investments: portfolioData.investments,
        summary: portfolioData.summary,
        indexData,
        currentIndex: indexSymbol,
        watchlist,
      }));
    })
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
