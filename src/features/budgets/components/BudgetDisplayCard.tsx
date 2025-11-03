/**
 * BudgetDisplayCard Component
 * Shows selected budget with icon, name, period, and actions menu
 */

'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { Budget, BudgetPeriod, CategoryIcon, iconSizes } from '@/lib';
import { budgetStyles } from '../theme/budget-styles';
import { MoreVertical } from 'lucide-react';
import React from 'react';

export interface BudgetDisplayCardProps {
  budget: Budget;
  period: BudgetPeriod | null;
  onEdit: (budget: Budget) => void;
}

export function BudgetDisplayCard({
  budget,
  period,
  onEdit,
}: Readonly<BudgetDisplayCardProps>) {
  return (
    <div className={budgetStyles.budgetDisplay.container}>
      {/* Budget Actions Dropdown - Top Right Corner */}
      <div className={budgetStyles.budgetDisplay.actionsMenu}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={budgetStyles.budgetDisplay.actionsButton}
              title="Azioni Budget"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2"
          >
            <DropdownMenuItem
              className="text-sm font-medium hover:bg-primary/8 hover:text-primary rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              onSelect={() => onEdit(budget)}
            >
              <span className="mr-2">✏️</span>{' '}
              Modifica Budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Budget Icon, Name and Period */}
      <div className={budgetStyles.budgetDisplay.headerRow}>
        <div className={budgetStyles.budgetDisplay.headerContent}>
          <div className={budgetStyles.budgetDisplay.iconContainer}>
            <CategoryIcon
              categoryKey={(budget.categories && budget.categories.length > 0) ? budget.categories[0] : 'altro'}
              size={iconSizes.lg}
              className="text-[#7578EC]"
            />
          </div>
          <div className={budgetStyles.budgetDisplay.iconText}>
            <h3 className={budgetStyles.budgetDisplay.budgetName}>
              {budget.description}
            </h3>
            <p className={budgetStyles.budgetDisplay.budgetStatus}>Budget attivo</p>
          </div>
        </div>

        {/* Budget Period Date */}
        {period && (
          <div className={budgetStyles.budgetDisplay.periodContainer}>
            <p className={budgetStyles.budgetDisplay.periodLabel}>Periodo</p>
            <p className={budgetStyles.budgetDisplay.periodValue}>
              {new Date(period.start_date).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              -{' '}
              {period.end_date
                ? new Date(period.end_date).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'In corso'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
