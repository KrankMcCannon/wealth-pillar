import * as React from "react";
import { ListContainer, PageSection, RowCard, SectionHeader } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { CategoryService, FinanceLogicService } from "@/lib/services";
import { CategoryIcon, iconSizes } from "@/lib";
import {
  reportsStyles,
  getAnnualCategoryIconStyle,
  getAnnualCategoryBarStyle,
} from "@/styles/system";
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
    <PageSection className={reportsStyles.annualCategory.container}>
      <SectionHeader title={title} subtitle={subtitle} />

      <PageSection
        variant="card"
        padding="none"
        className={cn(reportsStyles.card.container, reportsStyles.annualCategory.card)}
      >
        <ListContainer className={reportsStyles.annualCategory.list}>
          {spendingCategories.map((item) => {
            const categoryLabel = CategoryService.getCategoryLabel(categories, item.category);
            const categoryColor = CategoryService.getCategoryColor(categories, item.category);

            // Calculate width for relative bar based on net amount
            const barWidth = maxSpending > 0
              ? Math.max((item.net / maxSpending) * 100, 2)
              : 0;

            return (
              <div key={item.category} className={reportsStyles.annualCategory.item}>
                <RowCard
                  title={categoryLabel}
                  metadata={<span className={reportsStyles.annualCategory.count}>({item.count})</span>}
                  icon={
                    <div
                      className={reportsStyles.annualCategory.iconWrap}
                      style={getAnnualCategoryIconStyle(categoryColor)}
                    >
                      <CategoryIcon
                        categoryKey={item.category}
                        size={iconSizes.sm}
                      />
                    </div>
                  }
                  primaryValue={
                    <Amount type="expense" className={reportsStyles.annualCategory.amount}>
                      {item.net}
                    </Amount>
                  }
                  rightLayout="row"
                />

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
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
