'use client';

import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { UserFlowSummary } from '@/server/services/reports.service';
import { Wallet, Landmark, Banknote, PiggyBank } from 'lucide-react';

interface BudgetFlowVisualizerProps {
  userFlow: UserFlowSummary;
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  payroll: <Landmark className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  savings: <PiggyBank className="w-4 h-4" />,
};

// Colori semantici tramite classi Tailwind invece di hex hardcoded
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

export function BudgetFlowVisualizer({ userFlow }: BudgetFlowVisualizerProps) {
  const t = useTranslations('Reports.Charts');

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
    <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6">
      <div className="divide-y divide-primary/8">
        {accounts.map((acct) => {
          const colorClass = accountTypeColorClasses[acct.accountType] || defaultColorClass;
          const icon = accountTypeIcons[acct.accountType] || <Wallet className="w-4 h-4" />;
          const inPct = maxFlow > 0 ? Math.min((acct.earned / maxFlow) * 100, 100) : 0;
          const outPct = maxFlow > 0 ? Math.min((acct.spent / maxFlow) * 100, 100) : 0;

          return (
            <div key={acct.accountType} className="py-3 first:pt-0 last:pb-0">
              {/* Intestazione conto */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${colorClass.bg} ${colorClass.text}`}>
                    {icon}
                  </div>
                  <span className="font-semibold text-sm text-primary">
                    {getAccountLabel(acct.accountType)}
                  </span>
                </div>
                <span className="text-base font-bold tabular-nums text-primary">
                  {formatCurrency(acct.balance)}
                </span>
              </div>

              {/* Barre flusso */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-success/80 w-10 shrink-0 uppercase">
                    {t('in')}
                  </span>
                  <div className="flex-1 h-1.5 bg-primary/8 rounded-full overflow-hidden">
                    <div
                      className="h-full w-full bg-success/60 rounded-full origin-left transition-transform duration-500 ease-out"
                      style={{ transform: `scaleX(${inPct / 100})` }}
                    />
                  </div>
                  <span className="text-xs text-success tabular-nums font-medium shrink-0 w-20 text-right">
                    +{formatCurrency(acct.earned)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-destructive/80 w-10 shrink-0 uppercase">
                    {t('out')}
                  </span>
                  <div className="flex-1 h-1.5 bg-primary/8 rounded-full overflow-hidden">
                    <div
                      className="h-full w-full bg-destructive/60 rounded-full origin-left transition-transform duration-500 ease-out"
                      style={{ transform: `scaleX(${outPct / 100})` }}
                    />
                  </div>
                  <span className="text-xs text-destructive tabular-nums font-medium shrink-0 w-20 text-right">
                    -{formatCurrency(acct.spent)}
                  </span>
                </div>
              </div>

              {/* Net */}
              <div className="flex justify-end mt-2">
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    acct.net >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {t('net')}: {acct.net >= 0 ? '+' : ''}
                  {formatCurrency(acct.net)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
