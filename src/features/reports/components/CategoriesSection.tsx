'use client';

import type { CategoryStat } from '@/server/use-cases/reports/reports.use-cases';
import { PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

interface CategoriesSectionProps {
  incomeStats: CategoryStat[];
  expenseStats: CategoryStat[];
}

function CategoryList({ title, stats }: { title: string; stats: CategoryStat[] }) {
  const total = stats.reduce((acc, s) => acc + s.total, 0);
  const t = useTranslations('Reports.CategoriesSection');
  const { format: formatMoney } = useFormatCurrency();

  return (
    <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">{formatMoney(total)}</p>
      </div>

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
        {stats.length === 0 && <p className="text-sm text-primary/60 italic">{t('empty')}</p>}

        {stats.map((stat) => {
          const percent = total > 0 ? (stat.total / total) * 100 : 0;
          return (
            <div
              key={stat.id}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stat.color }} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-primary truncate">
                    {stat.name}
                  </span>
                  <div className="h-1 sm:h-1.5 w-full bg-primary/8 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                  {formatMoney(stat.total)}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {percent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoriesSection({ incomeStats, expenseStats }: CategoriesSectionProps) {
  const t = useTranslations('Reports.CategoriesSection');

  return (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary/70" aria-hidden />
        {t('title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <CategoryList title={t('incomeTitle')} stats={incomeStats} />
        <CategoryList title={t('expensesTitle')} stats={expenseStats} />
      </div>
    </div>
  );
}
