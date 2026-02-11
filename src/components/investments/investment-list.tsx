'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateInvestmentMetrics } from '@/lib/utils/investment-math';
import { useLocale, useTranslations } from 'next-intl';
import type { Investment } from './personal-investment-tab';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentListProps {
  investments: Investment[];
}

export function InvestmentList({ investments }: Readonly<InvestmentListProps>) {
  const t = useTranslations('Investments.InvestmentList');
  const locale = useLocale();
  const investmentMetrics = calculateInvestmentMetrics(investments);

  return (
    <Card className="border-none shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="px-5 py-4 border-b border-border/50 bg-linear-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-xl font-bold text-foreground">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {investments.length > 0 ? (
          <div className="divide-y divide-border/30">
            {investmentMetrics.map((inv) => {
              const isPositive = inv.totalGain >= 0;
              return (
                <div
                  key={inv.id}
                  className="group px-5 py-4 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                  {/* Top row: Name and Current Value */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground mb-1.5 truncate">
                        {inv.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                          {inv.symbol}
                        </span>
                        <span className="text-xs text-primary/60">•</span>
                        <span className="text-xs text-primary/60 font-medium">
                          {t('shares', { count: Number(inv.shares_acquired) })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-xl text-foreground tabular-nums">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.currentValue || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: Paid and Gain/Loss */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1.5 text-xs text-primary/60">
                      <span className="font-medium">{t('paidLabel')}</span>
                      <span className="font-semibold tabular-nums">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.totalPaid)}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {inv.totalGain >= 0 ? '+' : ''}
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.totalGain)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-primary/70 text-center">{t('empty')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
