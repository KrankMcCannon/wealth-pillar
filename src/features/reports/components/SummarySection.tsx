import { formatCurrency } from '@/lib/utils';
import { AccountTypeSummary } from '@/server/services/reports.service';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SummarySectionProps {
  accounts: AccountTypeSummary[];
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
      <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 py-8 px-4 text-center">
        <p className="text-sm text-primary/60">{t('empty')}</p>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.totalBalance, 0);

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
  const isPositiveNet = netFlow >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Saldo Totale */}
      <div className="bg-card border border-primary/15 rounded-xl p-3 sm:p-4 space-y-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('totalBalance')}
        </p>
        <p
          className={`text-lg sm:text-xl font-bold tabular-nums tracking-tight ${totalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}
        >
          {formatCurrency(totalBalance)}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('acrossAllAccounts')}</p>
      </div>

      {/* Entrate */}
      <div className="bg-card border border-primary/15 rounded-xl p-3 sm:p-4 space-y-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('income')}
        </p>
        <p className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-success">
          {formatCurrency(totalIncome)}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {isFiltered ? t('thisPeriod') : t('acrossAllAccounts')}
        </p>
      </div>

      {/* Uscite */}
      <div className="bg-card border border-primary/15 rounded-xl p-3 sm:p-4 space-y-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('expenses')}
        </p>
        <p className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-destructive">
          {formatCurrency(totalExpenses)}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {isFiltered ? t('thisPeriod') : t('acrossAllAccounts')}
        </p>
      </div>

      {/* Flusso Netto */}
      <div className="bg-card border border-primary/15 rounded-xl p-3 sm:p-4 space-y-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('netFlow')}
        </p>
        <p
          className={`text-lg sm:text-xl font-bold tabular-nums tracking-tight ${isPositiveNet ? 'text-success' : 'text-destructive'}`}
        >
          {formatCurrency(netFlow)}
        </p>
        <div
          className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium ${isPositiveNet ? 'text-success' : 'text-destructive'}`}
        >
          {isPositiveNet ? (
            <TrendingUp className="w-3 h-3" aria-hidden />
          ) : (
            <TrendingDown className="w-3 h-3" aria-hidden />
          )}
          {savingsRate}% {t('savingsRate')}
        </div>
      </div>
    </div>
  );
}
