/**
 * BudgetSelector Component
 * Dropdown selector for choosing which budget to view
 * Shows budget list with icons and names
 */

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui';
import { SectionHeader } from '@/components/layout';
import { Budget, CategoryIcon, iconSizes } from '@/lib';
import { budgetStyles } from '../theme/budget-styles';
import React from 'react';

export interface BudgetSelectorProps {
  selectedBudget: Budget | null;
  availableBudgets: Budget[];
  userNamesMap: Record<string, string>;
  selectedViewUserId: string;
  onBudgetSelect: (budgetId: string) => void;
}

export function BudgetSelector({
  selectedBudget,
  availableBudgets,
  userNamesMap,
  selectedViewUserId,
  onBudgetSelect,
}: BudgetSelectorProps) {
  return (
    <section className={budgetStyles.selectionSection}>
      {/* Section Header */}
      <div className={budgetStyles.sectionHeader.container}>
        <SectionHeader
          title="Budget"
          subtitle="Seleziona per visualizzare i dettagli"
          className="space-y-1"
        />
      </div>

      {/* Budget Selector Dropdown */}
      <div className="mb-4">
        <Select
          value={selectedBudget?.id || ''}
          onValueChange={onBudgetSelect}
        >
          <SelectTrigger className={budgetStyles.selector.trigger}>
            {selectedBudget ? (
              <div className={budgetStyles.selector.itemContent}>
                <div className={budgetStyles.selector.itemIcon}>
                  <CategoryIcon
                    categoryKey={selectedBudget.categories[0] || 'altro'}
                    size={iconSizes.sm}
                    className={budgetStyles.selector.itemIconContent}
                  />
                </div>
                <span className={budgetStyles.selector.itemText}>
                  {selectedBudget.description}
                </span>
              </div>
            ) : (
              <span className="text-primary/50">Seleziona budget</span>
            )}
          </SelectTrigger>
          <SelectContent className={budgetStyles.selector.content}>
            {availableBudgets.map((budget) => (
              <SelectItem
                key={budget.id}
                value={budget.id}
                className={budgetStyles.selector.item}
              >
                <div className={budgetStyles.selector.itemContent}>
                  <div className={budgetStyles.selector.itemIcon}>
                    <CategoryIcon
                      categoryKey={budget.categories[0] || 'altro'}
                      size={iconSizes.sm}
                      className={budgetStyles.selector.itemIconContent}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={budgetStyles.selector.itemText}>
                      {budget.description}
                    </span>
                    {selectedViewUserId === 'all' && userNamesMap[budget.user_id] && (
                      <span className={budgetStyles.selector.itemSubtext}>
                        ({userNamesMap[budget.user_id]})
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
