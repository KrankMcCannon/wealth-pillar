/**
 * Home Page Loading — stessa shell e griglia della home caricata (un solo blocco ricorrenze).
 */

import {
  DashboardHeaderSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
  UserSelectorSkeleton,
} from '@/features/dashboard';
import {
  HomeDashboardGrid,
  HomeDashboardMain,
  PageContainer,
  SkipToMainLink,
} from '@/components/layout';
import { homeDashboardLayoutStyles } from '@/components/layout/theme/home-dashboard-layout-styles';
import { getTranslations } from 'next-intl/server';

export default async function HomePageLoading() {
  const t = await getTranslations('HomeContent');

  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{t('skipToContent')}</SkipToMainLink>

      <DashboardHeaderSkeleton />
      <UserSelectorSkeleton />

      <HomeDashboardMain ariaBusy>
        <HomeDashboardGrid
          asideAriaLabel={t('recurringAsideLabel')}
          primary={
            <>
              <section
                aria-labelledby="home-dashboard-heading-loading"
                className={homeDashboardLayoutStyles.heroSection}
              >
                <h1
                  id="home-dashboard-heading-loading"
                  className={homeDashboardLayoutStyles.heroTitle}
                >
                  {t('checkFinancesHeading')}
                </h1>
                <div className={homeDashboardLayoutStyles.heroSkeletonLead} aria-hidden />
              </section>

              <BalanceSectionSkeleton />
              <BudgetSectionSkeleton />
            </>
          }
          aside={<RecurringSeriesSkeleton />}
        />
      </HomeDashboardMain>
    </PageContainer>
  );
}
