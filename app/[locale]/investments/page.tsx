import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/components/shared';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { InvestmentService, MarketDataService } from '@/server/services';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default async function InvestmentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations('InvestmentsPage');
  const searchParams = await props.searchParams;
  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'IVV';

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/sign-in');
  const groupUsers = await getGroupUsers();

  // Keep benchmark fetch non-blocking to avoid slow external API/cache misses delaying navigation.
  const [portfolioData, indexData] = await Promise.all([
    InvestmentService.getPortfolio(currentUser.id),
    withTimeout(
      MarketDataService.getCachedMarketData(indexSymbol),
      1500,
      [] as Awaited<ReturnType<typeof MarketDataService.getCachedMarketData>>
    ),
  ]);

  return (
    <Suspense fallback={<PageLoader message={t('loading')} />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        investments={portfolioData.investments}
        summary={portfolioData.summary}
        indexData={indexData}
        currentIndex={indexSymbol}
      />
    </Suspense>
  );
}
