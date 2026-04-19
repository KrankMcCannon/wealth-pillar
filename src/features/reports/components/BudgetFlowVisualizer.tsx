'use client';

import { useTranslations } from 'next-intl';
import type { UserFlowSummary } from '@/server/use-cases/reports/reports.use-cases';
import { Wallet, Landmark, Banknote, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

interface BudgetFlowVisualizerProps {
  userFlow: UserFlowSummary;
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  payroll: <Landmark className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  savings: <PiggyBank className="w-4 h-4" />,
};

const accountTypeColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  payroll: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  cash: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  savings: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
};

const defaultColorClass = {
  bg: 'bg-muted/10',
  text: 'text-muted-foreground',
  border: 'border-border',
};

type KnownAccountType = 'payroll' | 'cash' | 'savings';

const barFillClass =
  'h-full w-full rounded-full origin-left transition-transform duration-300 ease-out motion-reduce:transition-none';

export function BudgetFlowVisualizer({ userFlow }: BudgetFlowVisualizerProps) {
  const t = useTranslations('Reports.Charts');
  const { format: formatMoney } = useFormatCurrency();

  const accountTypeLabels: Record<KnownAccountType, string> = {
    payroll: t('accountTypes.payroll'),
    cash: t('accountTypes.cash'),
    savings: t('accountTypes.savings'),
  };

  const getAccountLabel = (type: string): string =>
    accountTypeLabels[type as KnownAccountType] ?? type.charAt(0).toUpperCase() + type.slice(1);

  const { accounts } = userFlow;
  const maxFlow = Math.max(...accounts.flatMap((a) => [a.earned, a.spent, 1]));

  return (
    <div className="bg-card border border-primary/15 rounded-xl p-3 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-primary">{t('flowTitle')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-3">
          {t('flowSubtitle')}
        </p>
      </div>
      <div className="divide-y divide-primary/8">
        {accounts.map((acct) => {
          const colorClass = accountTypeColorClasses[acct.accountType] || defaultColorClass;
          const icon = accountTypeIcons[acct.accountType] || <Wallet className="w-4 h-4" />;
          const inPct = maxFlow > 0 ? Math.min((acct.earned / maxFlow) * 100, 100) : 0;
          const outPct = maxFlow > 0 ? Math.min((acct.spent / maxFlow) * 100, 100) : 0;

          return (
            <div key={acct.accountType} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${colorClass.bg} ${colorClass.text}`}>
                    {icon}
                  </div>
                  <span className="font-semibold text-sm text-primary truncate">
                    {getAccountLabel(acct.accountType)}
                  </span>
                </div>
                <span className="text-base font-bold tabular-nums text-primary shrink-0">
                  {formatMoney(acct.balance)}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-success/80 uppercase whitespace-nowrap self-center">
                    {t('in')}
                  </span>
                  <div className="h-1.5 min-w-0 bg-primary/8 rounded-full overflow-hidden isolate">
                    <div
                      className={cn(barFillClass, 'bg-success/60')}
                      style={{ transform: `scaleX(${inPct / 100})` }}
                    />
                  </div>
                  <span className="text-xs text-success font-medium whitespace-nowrap text-end tabular-nums">
                    +{formatMoney(acct.earned)}
                  </span>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-destructive/80 uppercase whitespace-nowrap self-center">
                    {t('out')}
                  </span>
                  <div className="h-1.5 min-w-0 bg-primary/8 rounded-full overflow-hidden isolate">
                    <div
                      className={cn(barFillClass, 'bg-destructive/60')}
                      style={{ transform: `scaleX(${outPct / 100})` }}
                    />
                  </div>
                  <span className="text-xs text-destructive tabular-nums font-medium whitespace-nowrap text-end">
                    -{formatMoney(acct.spent)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    acct.net >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {t('net')}: {acct.net >= 0 ? '+' : ''}
                  {formatMoney(acct.net)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
