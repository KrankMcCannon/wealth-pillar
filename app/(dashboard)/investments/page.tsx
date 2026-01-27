import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/components/shared';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { InvestmentService, MarketDataService } from '@/server/services';

export default async function InvestmentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'IVV';

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth');
  const groupUsers = await getGroupUsers();

  // Parallel data fetching
  const [portfolioData, indexData] = await Promise.all([
    InvestmentService.getPortfolio(currentUser.id),
    MarketDataService.getCachedMarketData(indexSymbol),
  ]);

  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
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
