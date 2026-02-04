'use client';

import { BudgetCard } from '@/components/cards';
import { budgetStyles } from '@/styles/system';
import { Budget, UserBudgetSummary } from '@/lib/types';

interface BudgetSummaryActiveListProps {
  userSummary: UserBudgetSummary | null;
  budgets: Budget[];
  onBudgetClick: (budgetId: string) => void;
}

export function BudgetSummaryActiveList({
  userSummary,
  budgets,
  onBudgetClick,
}: Readonly<BudgetSummaryActiveListProps>) {
  if (!userSummary) return null;

  return (
    <div className={budgetStyles.summary.activeList.container}>
      <h3 className={budgetStyles.summary.activeList.title}>Budget Attivi</h3>

      <div className={budgetStyles.summary.activeList.listContainer}>
        {/* No header needed inside the card here as we selected the user above */}
        <div className={budgetStyles.summary.activeList.listBody}>
          {userSummary.budgets.map((bSummary, index) => {
            const budgetDef = budgets.find((b) => b.id === bSummary.id);
            if (!budgetDef) return null;

            return (
              <div
                key={bSummary.id}
                className={index > 0 ? budgetStyles.summary.activeList.itemWrapper : ''}
              >
                <BudgetCard
                  budget={budgetDef}
                  budgetInfo={{
                    id: bSummary.id,
                    spent: bSummary.spent,
                    remaining: bSummary.remaining,
                    progress: bSummary.percentage,
                  }}
                  onClick={() => onBudgetClick(budgetDef.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
