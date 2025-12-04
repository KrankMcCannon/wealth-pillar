/**
 * BudgetHeader Component
 * Header section with back button, title, and actions menu
 * Extracted from budgets/page.tsx for reusability
 */

"use client";

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import { PageHeaderWithBack } from "@/components/layout";
import { budgetStyles } from "../theme/budget-styles";
import { MoreVertical } from "lucide-react";
import React from "react";
import { Budget, BudgetPeriod } from "@/lib";

export interface BudgetHeaderProps {
  isDropdownOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBackClick: () => void;
  onCreateBudget: () => void;
  onCreateCategory: () => void;
  onManagePeriod: () => void;
  selectedBudget: Budget | null;
  currentPeriod: BudgetPeriod | null;
  title?: string;
}

export function BudgetHeader({
  isDropdownOpen,
  onOpenChange,
  onBackClick,
  onCreateBudget,
  onCreateCategory,
  onManagePeriod,
  selectedBudget,
  currentPeriod,
  title = "Budget"
}: BudgetHeaderProps) {
  const actions = (
    <DropdownMenu open={isDropdownOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={budgetStyles.header.button} aria-label="More options">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={budgetStyles.dropdownMenu.content} sideOffset={8}>
        {/* New Budget */}
        <DropdownMenuItem
          className={budgetStyles.dropdownMenu.item}
          onSelect={() => {
            onCreateBudget();
            onOpenChange(false);
          }}
        >
          <span className="mr-2">💰</span>
          Nuovo Budget
        </DropdownMenuItem>

        {/* New Category */}
        <DropdownMenuItem
          className={budgetStyles.dropdownMenu.item}
          onSelect={() => {
            onCreateCategory();
            onOpenChange(false);
          }}
        >
          <span className="mr-2">🏷️</span>
          Nuova Categoria
        </DropdownMenuItem>

        {/* Manage Period - Only show if budget is selected */}
        {selectedBudget && (
          <DropdownMenuItem
            className={budgetStyles.dropdownMenu.item}
            onSelect={() => {
              onManagePeriod();
              onOpenChange(false);
            }}
          >
            <span className="mr-2">📊</span>
            {currentPeriod?.is_active ? "Gestisci Periodo" : "Inizia Periodo"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <PageHeaderWithBack
      title={title}
      onBack={onBackClick}
      actions={actions}
      className={budgetStyles.header.container}
      contentClassName={budgetStyles.header.inner}
      titleClassName={budgetStyles.header.title}
      backButtonClassName={budgetStyles.header.button}
      variant="primary"
    />
  );
}
