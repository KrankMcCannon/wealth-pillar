import { formatCurrency } from '@/lib/utils';
import type { CategoryStat } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { PieChart } from 'lucide-react';

interface CategoriesSectionProps {
  incomeStats: CategoryStat[];
  expenseStats: CategoryStat[];
}

function CategoryList({ title, stats }: { title: string; stats: CategoryStat[] }) {
  const total = stats.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className={reportsStyles.categories.col}>
      <div className={reportsStyles.categories.colHeader}>
        <h4 className={reportsStyles.categories.colTitle}>{title}</h4>
        <span className={reportsStyles.categories.colTotal}>{formatCurrency(total)}</span>
      </div>

      <div className={reportsStyles.categories.list}>
        {stats.length === 0 && <p className="text-sm text-primary/60 italic">No data available.</p>}

        {stats.map((stat) => {
          const percent = total > 0 ? (stat.total / total) * 100 : 0;
          return (
            <div key={stat.id} className={reportsStyles.categories.item}>
              <div className="w-full">
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0 mb-1">
                  <div className={reportsStyles.categories.itemLeft}>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className={reportsStyles.categories.itemName}>{stat.name}</span>
                  </div>
                  <div className="w-full text-left sm:w-auto sm:text-right">
                    <div className={reportsStyles.categories.itemAmount}>
                      {formatCurrency(stat.total)}
                    </div>
                  </div>
                </div>
                <div className={reportsStyles.categories.barContainer}>
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
          );
        })}
      </div>
    </div>
  );
}

export function CategoriesSection({ incomeStats, expenseStats }: CategoriesSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className={reportsStyles.periods.sectionTitle}>
        <PieChart className="w-5 h-5" />
        Category Breakdown
      </h3>
      <div className={reportsStyles.categories.grid}>
        <CategoryList title="Income" stats={incomeStats} />
        <CategoryList title="Expenses" stats={expenseStats} />
      </div>
    </div>
  );
}
