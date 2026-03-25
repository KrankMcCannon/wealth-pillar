import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/components/shared';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import { InvestmentService, MarketDataService } from '@/server/services';

export default async function InvestmentsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations('InvestmentsPage');
  const searchParams = await props.searchParams;
  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'IVV';

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/${locale}/sign-in`);
  const groupUsers = await getGroupUsers();

  const investmentsDataPromise = Promise.all([
    InvestmentService.getPortfolio(currentUser.id),
    withTimeout(
      MarketDataService.getCachedMarketData(indexSymbol),
      1500,
      [] as Awaited<ReturnType<typeof MarketDataService.getCachedMarketData>>
    ),
  ])
    .then(([portfolioData, indexData]) => ({
      investments: portfolioData.investments,
      summary: portfolioData.summary,
      indexData,
      currentIndex: indexSymbol,
    }))
    .catch((err) => {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento del portafoglio';
      throw new Error(message, { cause: err });
    });

  return (
    <Suspense fallback={<PageLoader message={t('loading')} />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        investmentsDataPromise={investmentsDataPromise}
      />
    </Suspense>
  );
}
