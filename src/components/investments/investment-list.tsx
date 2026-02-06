'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateInvestmentMetrics } from '@/lib/utils/investment-math';
import { useLocale, useTranslations } from 'next-intl';
import type { Investment } from './personal-investment-tab';

interface InvestmentListProps {
  investments: Investment[];
}

export function InvestmentList({ investments }: Readonly<InvestmentListProps>) {
  const t = useTranslations('Investments.InvestmentList');
  const locale = useLocale();
  const investmentMetrics = calculateInvestmentMetrics(investments);

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="px-4 pt-4 border-b bg-primary/5">
        <CardTitle className="text-xl text-primary">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {investments.length > 0 ? (
          <div className="divide-y">
            {investmentMetrics.map((inv) => {
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 px-4 hover:bg-primary/5 transition-colors duration-200"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-lg text-primary">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {inv.symbol}
                      </span>
                      <span className="text-sm text-primary/60">•</span>
                      <span className="text-sm text-primary/60">
                        {t('shares', { count: Number(inv.shares_acquired) })}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-primary/5 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                    <p className="font-bold text-xl text-primary">
                      {new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: inv.currency,
                      }).format(inv.currentValue || 0)}
                    </p>
                    <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-x-4">
                      <p className="text-xs text-primary/60 mt-1">
                        {t('paidLabel')}{' '}
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.totalPaid)}
                      </p>
                      <p
                        className={`text-sm font-medium mt-1 ${inv.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {inv.totalGain >= 0 ? '+' : ''}
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.totalGain)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-primary/60">{t('empty')}</div>
        )}
      </CardContent>
    </Card>
  );
}
