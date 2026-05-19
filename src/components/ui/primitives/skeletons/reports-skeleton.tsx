import { BottomNavigation, PageContainer, HomeDashboardMain } from '@/components/layout';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { stitchReports } from '@/styles/home-design-foundation';

export function ReportsSkeleton() {
  const { skeletons: s } = reportsStyles;

  return (
    <PageContainer>
      {/* Premium Header Skeleton - Matches Header component structure */}
      <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
        <div className={headerStyles.inner}>
          <div className={headerStyles.slotLeft}>
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10 border border-primary/20" />
          </div>
          <div className={headerStyles.slotCenter}>
            <div className="h-5 w-32 animate-pulse rounded-lg bg-primary/20" />
          </div>
          <div className={headerStyles.slotRight}>
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10 border border-primary/20" />
          </div>
        </div>
      </header>

      {/* Sticky Filter Bar Skeleton - Matches ReportsTimeFilter structure */}
      <div className={stitchReports.stickyFilterBar}>
        <div className={stitchReports.chipRow}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-24 shrink-0 animate-pulse rounded-full border border-primary/20 bg-primary/10"
            />
          ))}
        </div>
      </div>

      <HomeDashboardMain id="main-reports-skeleton">
        <div className="flex flex-col gap-8 pt-4">
          {/* Hero Section */}
          <div className={s.hero}>
            <div className={s.heroLine1} />
            <div className={s.heroLine2} />
            <div className={s.heroLine3} />
          </div>

          {/* Quick Stats Grid */}
          <div className={s.grid}>
            <div className={s.gridItem} />
            <div className={s.gridItem} />
          </div>

          {/* Top Expenses */}
          <section className={s.section}>
            <div className={s.sectionTitle} />
            <div className={s.rankingCard}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={s.rankingItem}>
                  <div className={s.rankingItemHeader}>
                    <div className={s.rankingItemLabel} />
                    <div className={s.rankingItemAmount} />
                  </div>
                  <div className={s.rankingItemBar} />
                </div>
              ))}
            </div>
          </section>

          {/* Account Breakdown */}
          <section className={s.section}>
            <div className={s.sectionTitle} />
            <div className={s.accountList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={s.accountItem}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20" />
                    <div className="h-4 w-32 rounded bg-primary/20" />
                  </div>
                  <div className="h-4 w-20 rounded bg-primary/20" />
                </div>
              ))}
            </div>
          </section>

          {/* Historical Budget */}
          <section className={s.section}>
            <div className={s.sectionTitle} />
            <div className={s.budgetList}>
              {[1, 2].map((i) => (
                <div key={i} className={s.budgetItem} />
              ))}
            </div>
          </section>

          {/* Footer Actions */}
          <div className={s.footer}>
            <div className={s.footerTitle} />
            <div className={s.footerAction} />
          </div>
        </div>
      </HomeDashboardMain>

      <BottomNavigation />
    </PageContainer>
  );
}
