import * as React from "react";
import { Card } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { CategoryService, FinanceLogicService } from "@/lib/services";
import { CategoryIcon, iconSizes } from "@/lib";
import { reportsStyles } from "../theme/reports-styles";
import { cn } from "@/lib/utils/ui-variants";
import type { Transaction, Category } from "@/lib/types";

interface AnnualCategorySectionProps {
  transactions: Transaction[];
  categories: Category[];
  year?: number | 'all';
}

export function AnnualCategorySection({
  transactions,
  categories,
  year = new Date().getFullYear(),
}: AnnualCategorySectionProps) {
  const categoryBreakdown = React.useMemo(() => {
    return FinanceLogicService.calculateAnnualCategorySpending(transactions, year);
  }, [transactions, year]);

  // Filter only categories with spending (spent > 0, regardless of income)
  // Sort by net amount descending (highest to lowest)
  const spendingCategories = React.useMemo(() => {
    return categoryBreakdown
      .filter(item => item.spent > 0)
      .sort((a, b) => b.net - a.net);
  }, [categoryBreakdown]);

  if (spendingCategories.length === 0) {
    return null; // Don't show if no spending
  }

  // Calculate max value for progress bars (using net)
  const maxSpending = Math.max(...spendingCategories.map(c => c.net), 0);

  // Determine title and subtitle based on year selection
  const title = year === 'all' ? 'Spese per Categoria - Tutti i Tempi' : 'Spese Annuali per Categoria';
  const subtitle = year === 'all'
    ? 'Riepilogo completo di tutte le spese'
    : `Riepilogo spese dell'anno ${year}`;

  return (
    <section className="space-y-4">
      <div className={reportsStyles.sectionHeader.container}>
        <h2 className={reportsStyles.sectionHeader.title}>{title}</h2>
        <p className={reportsStyles.sectionHeader.subtitle}>{subtitle}</p>
      </div>

      <Card className={cn(reportsStyles.card.container, "p-4")}>
        <div className="space-y-4">
          {spendingCategories.map((item) => {
            const categoryLabel = CategoryService.getCategoryLabel(categories, item.category);
            const categoryColor = CategoryService.getCategoryColor(categories, item.category);

            // Calculate width for relative bar based on net amount
            const barWidth = maxSpending > 0
              ? Math.max((item.net / maxSpending) * 100, 2)
              : 0;

            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1 rounded-md shrink-0"
                      style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                    >
                      <CategoryIcon
                        categoryKey={item.category}
                        size={iconSizes.sm}
                      />
                    </div>
                    <span className="font-medium text-black">{categoryLabel}</span>
                    <span className="text-xs text-muted-foreground">({item.count})</span>
                  </div>
                  <Amount type="expense" className="font-semibold">{item.net}</Amount>
                </div>

                {/* Visual Bar */}
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: categoryColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
