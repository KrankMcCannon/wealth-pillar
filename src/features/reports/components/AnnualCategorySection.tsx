import * as React from "react";
import { Card } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { CategoryService, FinanceLogicService } from "@/lib/services";
import { CategoryIcon, iconSizes } from "@/lib";
import {
  reportsStyles,
  getAnnualCategoryIconStyle,
  getAnnualCategoryBarStyle,
} from "../theme/reports-styles";
import { cn } from "@/lib/utils";
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
    <section className={reportsStyles.annualCategory.container}>
      <div className={reportsStyles.sectionHeader.container}>
        <h2 className={reportsStyles.sectionHeader.title}>{title}</h2>
        <p className={reportsStyles.sectionHeader.subtitle}>{subtitle}</p>
      </div>

      <Card className={cn(reportsStyles.card.container, reportsStyles.annualCategory.card)}>
        <div className={reportsStyles.annualCategory.list}>
          {spendingCategories.map((item) => {
            const categoryLabel = CategoryService.getCategoryLabel(categories, item.category);
            const categoryColor = CategoryService.getCategoryColor(categories, item.category);

            // Calculate width for relative bar based on net amount
            const barWidth = maxSpending > 0
              ? Math.max((item.net / maxSpending) * 100, 2)
              : 0;

            return (
              <div key={item.category} className={reportsStyles.annualCategory.item}>
                <div className={reportsStyles.annualCategory.row}>
                  <div className={reportsStyles.annualCategory.rowLeft}>
                    <div
                      className={reportsStyles.annualCategory.iconWrap}
                      style={getAnnualCategoryIconStyle(categoryColor)}
                    >
                      <CategoryIcon
                        categoryKey={item.category}
                        size={iconSizes.sm}
                      />
                    </div>
                    <span className={reportsStyles.annualCategory.name}>{categoryLabel}</span>
                    <span className={reportsStyles.annualCategory.count}>({item.count})</span>
                  </div>
                  <Amount type="expense" className={reportsStyles.annualCategory.amount}>{item.net}</Amount>
                </div>

                {/* Visual Bar */}
                <div className={reportsStyles.annualCategory.bar}>
                  <div
                    className={reportsStyles.annualCategory.barFill}
                    style={getAnnualCategoryBarStyle(categoryColor, barWidth)}
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
