"use client";

import { Card } from "@/components/ui/card";
import { Amount } from "@/components/ui/primitives";
import { budgetStyles } from "@/styles/system";
import { UserBudgetSummary } from "@/lib/types";
import { TrendingUp, Wallet } from "lucide-react";

interface BudgetSummaryCardsProps {
  userSummary: UserBudgetSummary | null;
}

export function BudgetSummaryCards({ userSummary }: Readonly<BudgetSummaryCardsProps>) {
  if (!userSummary) return null;

  return (
    <div className={budgetStyles.summary.cardsGrid}>
      <Card className={budgetStyles.summary.card.budget}>
        <div className={budgetStyles.summary.cardHeader}>
          <Wallet className={budgetStyles.summary.cardIcon.budget} />
          <span className={budgetStyles.summary.cardLabel.budget}>Budget</span>
        </div>
        <Amount className={budgetStyles.summary.cardAmount.budget}>
          {userSummary.totalBudget}
        </Amount>
      </Card>

      <Card className={budgetStyles.summary.card.spent}>
        <div className={budgetStyles.summary.cardHeader}>
          <TrendingUp className={budgetStyles.summary.cardIcon.spent} />
          <span className={budgetStyles.summary.cardLabel.spent}>Speso</span>
        </div>
        <Amount className={budgetStyles.summary.cardAmount.spent}>
          {userSummary.totalSpent}
        </Amount>
      </Card>

      <Card className={budgetStyles.summary.card.available}>
        <div className={budgetStyles.summary.cardHeader}>
          <Wallet className={budgetStyles.summary.cardIcon.available} />
          <span className={budgetStyles.summary.cardLabel.available}>Disponibile</span>
        </div>
        <Amount className={budgetStyles.summary.cardAmount.available}>
          {userSummary.totalBudget - userSummary.totalSpent}
        </Amount>
      </Card>
    </div>
  );
}
