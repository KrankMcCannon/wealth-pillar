'use client';

import { formatCurrency } from '@/lib/utils';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { useTranslations } from 'next-intl';
import type { UserFlowSummary } from '@/server/services/reports.service';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Landmark,
  Banknote,
  PiggyBank,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BudgetFlowVisualizerProps {
  userFlow: UserFlowSummary;
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  payroll: <Landmark className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  savings: <PiggyBank className="w-4 h-4" />,
};

const accountTypeColors: Record<string, string> = {
  payroll: '#10b981',
  cash: '#6366f1',
  savings: '#f59e0b',
};

export function BudgetFlowVisualizer({ userFlow }: BudgetFlowVisualizerProps) {
  const t = useTranslations('Reports.Charts');

  const { totalEarned, totalSpent, netFlow, accounts } = userFlow;

  // For bar scaling
  const maxFlow = Math.max(...accounts.flatMap((a) => [a.earned, a.spent, 1]));

  return (
    <div className={reportsStyles.flow.container}>
      {/* Header */}
      <div className="mb-4">
        <h3 className={reportsStyles.charts.title}>{t('flowTitle')}</h3>
        <p className={reportsStyles.charts.subtitle}>{t('flowSubtitle')}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Summary bar: total IN / OUT / NET */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex flex-col p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] uppercase font-semibold text-emerald-500/70 tracking-wide">
                {t('income')}
              </span>
            </div>
            <span className="text-sm sm:text-base font-bold text-emerald-500 tabular-nums">
              +{formatCurrency(totalEarned)}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] uppercase font-semibold text-red-500/70 tracking-wide">
                {t('expense')}
              </span>
            </div>
            <span className="text-sm sm:text-base font-bold text-red-500 tabular-nums">
              -{formatCurrency(totalSpent)}
            </span>
          </div>
          <div
            className={`flex flex-col p-3 rounded-xl border ${
              netFlow >= 0
                ? 'bg-emerald-500/5 border-emerald-500/10'
                : 'bg-red-500/5 border-red-500/10'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet
                className={`w-3.5 h-3.5 ${netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
              />
              <span
                className={`text-[10px] uppercase font-semibold tracking-wide ${
                  netFlow >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'
                }`}
              >
                Net
              </span>
            </div>
            <span
              className={`text-sm sm:text-base font-bold tabular-nums ${
                netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {netFlow >= 0 ? '+' : ''}
              {formatCurrency(netFlow)}
            </span>
          </div>
        </div>

        {/* Per-account cards */}
        <div className="space-y-3">
          {accounts.map((acct) => {
            const color = accountTypeColors[acct.accountType] || '#94a3b8';
            const icon = accountTypeIcons[acct.accountType] || <Wallet className="w-4 h-4" />;

            // Compute start balance: currentBalance - earned + spent
            const startBalance = acct.balance - acct.earned + acct.spent;

            // Include start balance in the IN calculation for display
            const totalIn = acct.earned + startBalance;

            return (
              <div
                key={acct.accountType}
                className="p-3 sm:p-4 rounded-xl bg-white/2 border border-white/5"
              >
                {/* Account header: type name + current balance */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {icon}
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      {acct.accountType.charAt(0).toUpperCase() + acct.accountType.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold tabular-nums text-foreground block">
                      {formatCurrency(acct.balance)}
                    </span>
                  </div>
                </div>

                {/* Flow bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-emerald-500/80 w-7 shrink-0">
                      In
                    </span>
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(totalIn / maxFlow) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-emerald-500 tabular-nums font-medium shrink-0 w-24 text-right">
                      +{formatCurrency(totalIn)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-red-500/80 w-7 shrink-0">
                      Out
                    </span>
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-red-500/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(acct.spent / maxFlow) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs text-red-500 tabular-nums font-medium shrink-0 w-24 text-right">
                      -{formatCurrency(acct.spent)}
                    </span>
                  </div>
                </div>

                {/* Net result */}
                <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      acct.net >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    Net: {acct.net >= 0 ? '+' : ''}
                    {formatCurrency(acct.net)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
