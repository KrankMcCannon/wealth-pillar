import { formatCurrency } from '@/lib/utils';
import type { CategoryStat } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategoriesSectionProps {
  incomeStats: CategoryStat[];
  expenseStats: CategoryStat[];
}

function CategoryList({ title, stats }: { title: string; stats: CategoryStat[] }) {
  const total = stats.reduce((acc, s) => acc + s.total, 0);
  const t = useTranslations('Reports.CategoriesSection');

  return (
    <div className={reportsStyles.charts.container}>
      <div className={reportsStyles.charts.header}>
        <div>
          <h4 className={reportsStyles.charts.title}>{title}</h4>
          <p className={reportsStyles.charts.subtitle}>{formatCurrency(total)}</p>
        </div>
      </div>

      <div className={reportsStyles.categories.legendContainer}>
        {stats.length === 0 && <p className="text-sm text-primary/60 italic">{t('empty')}</p>}

        {stats.map((stat) => {
          const percent = total > 0 ? (stat.total / total) * 100 : 0;
          return (
            <div key={stat.id} className={reportsStyles.categories.item}>
              <div className={reportsStyles.categories.itemLeft}>
                <div
                  className={reportsStyles.categories.iconBox}
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <div className="h-3 w-3 rounded-full bg-current" />
                </div>
                <div className={reportsStyles.categories.details}>
                  <span className={reportsStyles.categories.name}>{stat.name}</span>
                  <div className={reportsStyles.categories.barBg}>
                    <div
                      className={reportsStyles.categories.barFill}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: stat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className={reportsStyles.categories.amount}>{formatCurrency(stat.total)}</div>
                <div className={reportsStyles.categories.percent}>{percent.toFixed(1)}%</div>
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
      <h3 className={reportsStyles.periods.sectionTitle}>
        <PieChart className="w-5 h-5" />
        {t('title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <CategoryList title={t('incomeTitle')} stats={incomeStats} />
        <CategoryList title={t('expensesTitle')} stats={expenseStats} />
      </div>
    </div>
  );
}
