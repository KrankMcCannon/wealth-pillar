'use client';

/**
 * Home briefing, in priority order: can I spend, am I on track this period,
 * what’s already committed, what posted.
 */

import { useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { BudgetSection } from '@/features/budgets';
import { HomeUpcomingSection } from '@/features/recurring/components/home-upcoming-section';
import { RecentActivitySection } from '@/features/transactions';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';
import type {
  Category,
  RecurringTransactionSeries,
  Transaction,
  UserBudgetSummary,
} from '@/lib/types';

export interface HomeBriefingProps {
  spendableBalance: number;
  reserveBalance: number;
  selectedUserId?: string | undefined;
  budgetsByUser: Record<string, UserBudgetSummary>;
  selectedViewUserId?: string | undefined;
  recurringSeries: RecurringTransactionSeries[];
  recurringFilterUserId?: string | undefined;
  recentTransactions: Transaction[];
  categories: Category[];
  onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

function accountsHref(selectedUserId?: string): string {
  return selectedUserId ? `/accounts?user=${encodeURIComponent(selectedUserId)}` : '/accounts';
}

export function HomeBriefing({
  spendableBalance,
  reserveBalance,
  selectedUserId,
  budgetsByUser,
  selectedViewUserId,
  recurringSeries,
  recurringFilterUserId,
  recentTransactions,
  categories,
  onEditRecurringSeries,
  onEditTransaction,
}: HomeBriefingProps) {
  const t = useTranslations('HomeContent');
  const isNegative = spendableBalance < 0;

  return (
    <div className="flex flex-col gap-5">
      <section className={stitchHome.balanceSection} aria-labelledby="home-spendable-heading">
        <Link
          href={accountsHref(selectedUserId)}
          className="flex flex-col gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p id="home-spendable-heading" className={stitchHome.sectionEyebrow}>
              {t('spendableLabel')}
            </p>
            <span className="text-sm font-semibold text-primary">{t('spendableViewAll')}</span>
          </div>
          <p className="sr-only">{t('spendableHint')}</p>
          <p className="leading-none">
            <Amount
              type={isNegative ? 'expense' : 'balance'}
              size="2xl"
              emphasis="strong"
              className={cn(
                isNegative ? stitchHome.balanceHeroNegative : stitchHome.balanceHero,
                'text-[2.75rem] leading-none tracking-[-0.04em]'
              )}
            >
              {spendableBalance}
            </Amount>
          </p>
          {reserveBalance !== 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('reserveLabel')}:{' '}
              <Amount type="balance" size="sm" className="inline text-foreground">
                {reserveBalance}
              </Amount>
            </p>
          ) : null}
        </Link>
      </section>

      <BudgetSection budgetsByUser={budgetsByUser} selectedViewUserId={selectedViewUserId} />

      <HomeUpcomingSection
        series={recurringSeries}
        selectedUserId={recurringFilterUserId}
        onEditRecurringSeries={onEditRecurringSeries}
      />

      <RecentActivitySection
        transactions={recentTransactions}
        categories={categories}
        onEditTransaction={onEditTransaction}
      />
    </div>
  );
}
