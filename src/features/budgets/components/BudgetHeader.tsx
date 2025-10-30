/**
 * BudgetHeader Component
 * Header section with back button, title, and actions menu
 * Extracted from budgets/page.tsx for reusability
 */

'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { budgetStyles } from '../theme/budget-styles';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import React, { ReactNode } from 'react';
import { Budget, BudgetPeriod } from '@/lib';

export interface BudgetHeaderProps {
  isDropdownOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBackClick: () => void;
  onCreateBudget: () => void;
  onCreateCategory: () => void;
  selectedBudget: Budget | null;
  currentPeriod: BudgetPeriod | null;
  onPeriodManagerSuccess: () => void;
  periodManagerComponent?: ReactNode;
}

export function BudgetHeader({
  isDropdownOpen,
  onOpenChange,
  onBackClick,
  onCreateBudget,
  onCreateCategory,
  selectedBudget,
  periodManagerComponent,
}: BudgetHeaderProps) {
  return (
    <header className={budgetStyles.header.container}>
      <div className={budgetStyles.header.inner}>
        {/* Left - Back button */}
        <Button
          variant="ghost"
          size="sm"
          className={budgetStyles.header.button}
          onClick={onBackClick}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Center - Title */}
        <h1 className={budgetStyles.header.title}>Budget</h1>

        {/* Right - Three dots menu */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={budgetStyles.header.button}
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={budgetStyles.dropdownMenu.content}
            sideOffset={8}
          >
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

            {/* Manage Periods - Optional component injection */}
            {selectedBudget && periodManagerComponent}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
