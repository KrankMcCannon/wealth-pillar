'use client';

import { Suspense, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Budget, BudgetPeriod, User } from '@/lib';
import { progressBarVariants } from '@/lib';
import { BudgetSectionSkeleton } from '@/features/dashboard';
import { SectionHeader } from '@/components/layout';
import { PageSection, RowCard } from '@/components/ui/layout';
import { BudgetCard } from '@/components/cards';
import { formatCurrency } from '@/lib/utils/currency-formatter';
import {
  budgetStyles,
  getBudgetSectionProgressStyles,
  getBudgetGroupCardStyle,
  getBudgetSectionProgressBarStyle,
} from '@/styles/system';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface BudgetSectionProps {
  budgetsByUser: Record<
    string,
    {
      user: User;
      budgets: Array<{
        id: string;
        description: string;
        amount: number;
        spent: number;
        remaining: number;
        percentage: number;
        categories: string[];
        transactionCount: number;
      }>;
      activePeriod: BudgetPeriod | undefined;
      periodStart: string | null;
      periodEnd: string | null;
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      overallPercentage: number;
    }
  >;
  budgets: Budget[];
  selectedViewUserId?: string | undefined;
  isLoading?: boolean;
  headerLeading?: React.ReactNode;
}

/**
 * Budget section component with enhanced UX and performance
 * Follows Single Responsibility Principle - only handles budget display
 */
export const BudgetSection = ({
  budgetsByUser,
  budgets,
  selectedViewUserId,
  isLoading,
  headerLeading,
}: BudgetSectionProps) => {
  const router = useRouter();
  const t = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const goToBudgets = useCallback(() => router.push('/budgets'), [router]);
  const goToBudgetSummary = useCallback(
    (userId: string) => router.push(`/budgets/summary?userId=${userId}`),
    [router]
  );

  // Show skeleton only if actively loading AND no data received yet
  // With placeholderData, empty object exists immediately, so check both conditions
  const allBudgetEntries = Object.values(budgetsByUser);

  // Filter budget entries based on selected user
  // If selectedViewUserId is undefined, show all budgets
  const budgetEntries = selectedViewUserId
    ? allBudgetEntries.filter((entry) => entry.user.id === selectedViewUserId)
    : allBudgetEntries;

  const totalBudgetRows = budgetEntries.reduce((sum, entry) => sum + entry.budgets.length, 0);

  const isInitialLoading = isLoading && budgetEntries.length === 0;

  if (isInitialLoading) {
    return <BudgetSectionSkeleton />;
  }

  // Allinea alla pagina /budgets: senza budget configurati non mostrare la card di gruppo "a zero"
  if (budgetEntries.length === 0 || totalBudgetRows === 0) {
    return (
      <PageSection className={budgetStyles.section.container}>
        <SectionHeader
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-4 border-b border-border/40 pb-4 dark:border-border/35"
        />
        <div className={budgetStyles.section.emptyContainer}>
          <div className={budgetStyles.section.emptyIconWrap}>
            <div className={budgetStyles.section.emptyIconInner}>
              <span className={budgetStyles.section.emptyIconText}>€</span>
            </div>
          </div>
          <h3 className={budgetStyles.section.emptyTitle}>{t('empty.title')}</h3>
          <p className={budgetStyles.section.emptyDescription}>{t('empty.description')}</p>
          <button type="button" onClick={goToBudgets} className={budgetStyles.section.emptyButton}>
            {t('empty.createButton')}
          </button>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection className={budgetStyles.section.container}>
      <SectionHeader
        title={t('title')}
        subtitle={
          budgetEntries.length > 1
            ? t('multiUsersSubtitle', { count: budgetEntries.length })
            : undefined
        }
        leading={headerLeading}
        className={cn(
          'border-b border-border/40 dark:border-border/35',
          headerLeading && 'items-start'
        )}
      />

      <div className={budgetStyles.transactions.container}>
        {[...budgetEntries]
          .sort((a, b) => b.totalBudget - a.totalBudget)
          .map((userBudgetGroup, index) => {
            const {
              user,
              budgets: userBudgets,
              activePeriod,
              periodStart,
              periodEnd,
              totalBudget,
              totalSpent,
              totalRemaining,
              overallPercentage,
            } = userBudgetGroup;
            const progressClasses = getBudgetSectionProgressStyles(overallPercentage);

            return (
              <div
                key={user.id}
                className={budgetStyles.section.groupCard}
                style={getBudgetGroupCardStyle(index)}
              >
                {/* Mobile-First Compact User Header */}
                <button
                  type="button"
                  className={`${budgetStyles.section.groupHeader} min-h-11 w-full cursor-pointer text-left transition-colors hover:bg-primary/5 motion-reduce:transition-none`}
                  onClick={() => goToBudgetSummary(user.id)}
                >
                  {/* User Info Row */}
                  <RowCard
                    icon={
                      <span className={budgetStyles.section.avatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    }
                    iconClassName={budgetStyles.section.avatar}
                    title={user.name}
                    subtitle={
                      activePeriod && periodStart ? (
                        <span className={budgetStyles.section.periodText}>
                          {new Date(periodStart).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          -{' '}
                          {periodEnd
                            ? new Date(periodEnd).toLocaleDateString(locale, {
                                day: 'numeric',
                                month: 'short',
                              })
                            : t('periodOngoing')}
                        </span>
                      ) : undefined
                    }
                    primaryValue={
                      <div className="flex flex-col items-end gap-1 pr-0.5">
                        {/* Label + main amount */}
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground leading-none mb-0.5">
                            {totalRemaining >= 0
                              ? t('availablePrefix', { defaultValue: 'DISPONIBILE' })
                              : t('exceededPrefix', { defaultValue: 'SFORAMENTO' })}
                          </span>
                          <span
                            className={cn(
                              'text-base sm:text-lg font-black tracking-tight leading-none',
                              totalRemaining >= 0 ? 'text-success' : 'text-destructive'
                            )}
                          >
                            {formatCurrency(Math.abs(isNaN(totalRemaining) ? 0 : totalRemaining))}
                          </span>
                        </div>

                        {/* Speso / Totale compact inline */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground font-semibold tracking-wide uppercase">
                            {t('spentPrefix', { defaultValue: 'SPESO' })}{' '}
                            <span className="text-primary/70 font-bold">
                              {formatCurrency(isNaN(totalSpent) ? 0 : totalSpent)}
                            </span>
                          </span>
                          <span className="text-muted-foreground/40 text-[9px]">·</span>
                          <span className="text-[9px] text-muted-foreground font-semibold tracking-wide uppercase">
                            {t('totalPrefix', { defaultValue: 'TOT' })}{' '}
                            <span className="text-primary/80 font-bold">
                              {formatCurrency(isNaN(totalBudget) ? 0 : totalBudget)}
                            </span>
                          </span>
                        </div>
                      </div>
                    }
                    rightLayout="row"
                  />

                  {/* Progress Bar with Inline Percentage */}
                  <div className={budgetStyles.section.progressRow}>
                    {(() => {
                      let status: 'danger' | 'warning' | 'neutral' = 'neutral';
                      if (overallPercentage > 100) {
                        status = 'danger';
                      } else if (overallPercentage > 75) {
                        status = 'warning';
                      }

                      return (
                        <div className={budgetStyles.section.progressBarTrack}>
                          <div className={cn(progressBarVariants({ status }), 'h-2.5 sm:h-3')}>
                            <div
                              className={`${budgetStyles.progress.barFillBase} ${progressClasses.bar}`}
                              style={getBudgetSectionProgressBarStyle(overallPercentage)}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    <div className={budgetStyles.section.progressBadge}>
                      <div
                        className={`${budgetStyles.section.progressBadgeDot} ${progressClasses.dot}`}
                      />
                      <span
                        className={`${budgetStyles.section.progressBadgeText} ${progressClasses.text}`}
                      >
                        {Math.round(overallPercentage)}%
                      </span>
                    </div>
                  </div>
                </button>

                {/* User's Budget Cards */}
                <div className={budgetStyles.section.cardsDivider}>
                  {[...userBudgets]
                    .sort((a, b) => b.amount - a.amount)
                    .map((budgetInfo) => {
                      const budget = budgets.find((b: Budget) => b.id === budgetInfo.id);
                      if (!budget) return null;

                      const mappedBudgetInfo = {
                        id: budgetInfo.id,
                        spent: budgetInfo.spent,
                        remaining: budgetInfo.remaining,
                        progress: budgetInfo.percentage,
                      };

                      return (
                        <Suspense
                          key={budget.id}
                          fallback={
                            <div className={budgetStyles.section.cardSkeleton}>
                              <div className={budgetStyles.section.cardSkeletonRow}>
                                <div className={budgetStyles.section.cardSkeletonIcon} />
                                <div className={budgetStyles.section.cardSkeletonBody}>
                                  <div className={budgetStyles.section.cardSkeletonTitle} />
                                  <div className={budgetStyles.section.cardSkeletonSubtitle} />
                                </div>
                                <div className={budgetStyles.section.cardSkeletonRight}>
                                  <div className={budgetStyles.section.cardSkeletonAmount} />
                                  <div className={budgetStyles.section.cardSkeletonSubAmount} />
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <BudgetCard
                            budget={budget}
                            budgetInfo={mappedBudgetInfo}
                            onClick={() => {
                              const params = new URLSearchParams();
                              params.set('budget', budget.id);
                              // Always pass the budget owner's user_id
                              params.set('member', budget.user_id);
                              router.push(`/budgets?${params.toString()}`);
                            }}
                          />
                        </Suspense>
                      );
                    })}
                </div>
              </div>
            );
          })}
      </div>
    </PageSection>
  );
};

export default BudgetSection;
