/**
 * BudgetDisplayCard Component
 * Shows selected budget with icon, name, period, and actions menu
 */

"use client";

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import { Budget, BudgetPeriod, CategoryIcon, iconSizes } from "@/lib";
import { budgetStyles } from "../theme/budget-styles";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export interface BudgetDisplayCardProps {
  budget: Budget | null;
  period: BudgetPeriod | null;
  budgetProgress: {
    spent: number;
    remaining: number;
    percentage: number;
    amount: number;
  } | null;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetDisplayCard({
  budget,
  period,
  budgetProgress,
  onEdit,
  onDelete,
}: Readonly<BudgetDisplayCardProps>) {
  if (!budget) return null;

  const remainingColorClass = budgetProgress && budgetProgress.remaining < 0 ? "text-destructive" : "text-success";

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
              <MoreVertical className={budgetStyles.budgetDisplay.actionIcon} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={budgetStyles.dropdownMenu.contentWide}
          >
            <DropdownMenuItem
              className={`${budgetStyles.dropdownMenu.itemBase} ${budgetStyles.dropdownMenu.itemEdit}`}
              onSelect={() => onEdit(budget)}
            >
              <Pencil className={`${budgetStyles.budgetDisplay.actionIcon} ${budgetStyles.dropdownMenu.itemIcon}`} />
              Modifica Budget
            </DropdownMenuItem>

            <DropdownMenuItem
              className={`${budgetStyles.dropdownMenu.itemBase} ${budgetStyles.dropdownMenu.itemDelete}`}
              onSelect={() => onDelete(budget)}
            >
              <Trash2 className={`${budgetStyles.budgetDisplay.actionIcon} ${budgetStyles.dropdownMenu.itemIcon}`} />
              Elimina Budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Budget Icon, Name and Period */}
      <div className={budgetStyles.budgetDisplay.headerRow}>
        <div className={budgetStyles.budgetDisplay.headerContent}>
          <div className={budgetStyles.budgetDisplay.iconContainer}>
            <CategoryIcon
              categoryKey={budget.categories?.[0] || "altro"}
              size={iconSizes.sm}
              className={budgetStyles.budgetDisplay.iconClass}
            />
          </div>
          <div className={budgetStyles.budgetDisplay.iconText}>
            <h3 className={budgetStyles.budgetDisplay.budgetName}>{budget.description}</h3>
            <p className={budgetStyles.budgetDisplay.budgetStatus}>Budget attivo</p>
          </div>
        </div>

        {/* Budget Period Date */}
        {period && (
          <div className={budgetStyles.budgetDisplay.periodContainer}>
            <p className={budgetStyles.budgetDisplay.periodLabel}>Periodo</p>
            <p className={budgetStyles.budgetDisplay.periodValue}>
              {new Date(period.start_date).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "short",
              })}{" "}
              -{" "}
              {period.end_date
                ? new Date(period.end_date).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                  })
                : "In corso"}
            </p>
          </div>
        )}
      </div>

      {/* Budget Metrics - Balances */}
      {budgetProgress && (
        <div className={budgetStyles.metrics.container}>
          {/* Available Amount */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} ${remainingColorClass}`}>Disponibile</p>
            <p className={`${budgetStyles.metrics.value} ${remainingColorClass}`}>
              {formatCurrency(budgetProgress.remaining)}
            </p>
          </div>

          {/* Spent Amount */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} text-destructive`}>Speso</p>
            <p className={`${budgetStyles.metrics.value} ${budgetStyles.metrics.valueDanger}`}>{formatCurrency(budgetProgress.spent)}</p>
          </div>

          {/* Total Budget */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} text-primary`}>Totale</p>
            <p className={`${budgetStyles.metrics.value} text-primary`}>{formatCurrency(budgetProgress.amount)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
