/**
 * BudgetHeader Component
 * Header section with back button, title, and actions menu
 * Extracted from budgets/page.tsx for reusability
 */

"use client";

import { PageHeaderWithBack, type ActionMenuItem } from "@/components/layout";
import { budgetStyles } from "../theme/budget-styles";
import { DollarSign, Tag, BarChart3 } from "lucide-react";
import React, { useMemo } from "react";
import { Budget, BudgetPeriod } from "@/lib";

export interface BudgetHeaderProps {
  onBackClick: () => void;
  onCreateBudget: () => void;
  onCreateCategory: () => void;
  onManagePeriod: () => void;
  selectedBudget: Budget | null;
  currentPeriod: BudgetPeriod | null;
  title?: string;
}

export function BudgetHeader({
  onBackClick,
  onCreateBudget,
  onCreateCategory,
  onManagePeriod,
  selectedBudget,
  currentPeriod,
  title = "Budget"
}: BudgetHeaderProps) {
  // Build actions menu dynamically based on state
  const actionsMenu: ActionMenuItem[] = useMemo(() => {
    const menu: ActionMenuItem[] = [
      {
        label: 'Nuovo Budget',
        icon: DollarSign,
        onClick: onCreateBudget,
      },
      {
        label: 'Nuova Categoria',
        icon: Tag,
        onClick: onCreateCategory,
      },
    ];

    // Add manage period option only if budget is selected
    if (selectedBudget) {
      menu.push({
        label: currentPeriod?.is_active ? 'Gestisci Periodo' : 'Inizia Periodo',
        icon: BarChart3,
        onClick: onManagePeriod,
      });
    }

    return menu;
  }, [selectedBudget, currentPeriod, onCreateBudget, onCreateCategory, onManagePeriod]);

  return (
    <PageHeaderWithBack
      title={title}
      onBack={onBackClick}
      actionsMenu={actionsMenu}
      className={budgetStyles.header.container}
      contentClassName={budgetStyles.header.inner}
      titleClassName={budgetStyles.header.title}
      backButtonClassName={budgetStyles.header.button}
      variant="primary"
    />
  );
}
