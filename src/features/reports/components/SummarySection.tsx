import { formatCurrency } from '@/lib/utils';
import { AccountTypeSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface SummarySectionProps {
  accounts: AccountTypeSummary[];
  /** When filtered, these are pre-computed from transactions in the selected range */
  filteredIncome: number | null;
  filteredExpenses: number | null;
  isFiltered: boolean;
}

export function SummarySection({
  accounts,
  filteredIncome,
  filteredExpenses,
  isFiltered,
}: SummarySectionProps) {
  const t = useTranslations('Reports.SummarySection');

  if (accounts.length === 0) {
    return (
      <div className={reportsStyles.periods.emptyContainer}>
        <p className={reportsStyles.periods.emptyText}>{t('empty')}</p>
      </div>
    );
  }

  // Balance: always from account summaries (live state)
  const totalBalance = accounts.reduce((sum, a) => sum + a.totalBalance, 0);

  // Income/Expenses: from filtered transactions when time range is selected,
  // from account summaries (all-time) otherwise
  const totalIncome =
    isFiltered && filteredIncome !== null
      ? filteredIncome
      : accounts.reduce((sum, a) => sum + a.totalEarned, 0);

  const totalExpenses =
    isFiltered && filteredExpenses !== null
      ? filteredExpenses
      : accounts.reduce((sum, a) => sum + a.totalSpent, 0);

  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netFlow / totalIncome) * 100).toFixed(1) : '0';

  const cards = [
    {
      label: t('totalBalance'),
      value: formatCurrency(totalBalance),
      subtext: t('acrossAllAccounts'),
      icon: Wallet,
      positive: totalBalance >= 0,
      isNetFlow: false,
    },
    {
      label: t('income'),
      value: formatCurrency(totalIncome),
      subtext: isFiltered ? t('thisPeriod') : t('acrossAllAccounts'),
      icon: ArrowUpCircle,
      positive: true,
      isNetFlow: false,
    },
    {
      label: t('expenses'),
      value: formatCurrency(totalExpenses),
      subtext: isFiltered ? t('thisPeriod') : t('acrossAllAccounts'),
      icon: ArrowDownCircle,
      positive: false,
      isNetFlow: false,
    },
    {
      label: t('netFlow'),
      value: formatCurrency(netFlow),
      subtext: '',
      icon: Activity,
      positive: netFlow >= 0,
      isNetFlow: true,
    },
  ];

  return (
    <div className={reportsStyles.summary.grid}>
      {cards.map((card) => (
        <div key={card.label} className={reportsStyles.summary.card}>
          <div className={reportsStyles.summary.gradientOverlay} />
          <div className={reportsStyles.summary.cardHeader}>
            <span className={reportsStyles.summary.cardTitle}>{card.label}</span>
            <card.icon className={reportsStyles.summary.cardIcon} />
          </div>
          <div className={reportsStyles.summary.cardContent}>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {card.value}
            </p>
            {card.isNetFlow ? (
              <span
                className={
                  card.positive
                    ? reportsStyles.summary.trendBadge
                    : reportsStyles.summary.trendBadgeNegative
                }
              >
                {card.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {savingsRate}% {t('savingsRate')}
              </span>
            ) : (
              <p className={reportsStyles.summary.subtext}>{card.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
