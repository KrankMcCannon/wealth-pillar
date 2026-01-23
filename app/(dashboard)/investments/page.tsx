import { Suspense } from 'react';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/components/shared';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { InvestmentService } from '@/server/services';
import { twelveData } from '@/lib/twelve-data';

export default async function InvestmentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'SPY';

  const { currentUser, groupUsers } = await getDashboardData();

  // Parallel data fetching
  const [portfolioData, indexData] = await Promise.all([
    InvestmentService.getPortfolio(currentUser.id),
    twelveData.getTimeSeries(indexSymbol)
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
