/**
 * BudgetSelector Component
 * Dropdown selector for choosing which budget to view
 * Shows budget list with icons and names
 */

'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui';
import { PageSection, SectionHeader } from "@/components/ui";
import { Budget, CategoryIcon, iconSizes, User } from '@/lib';
import { budgetStyles } from '@/styles/system';
import { useUserFilter } from '@/hooks/state/use-user-filter';

export interface BudgetSelectorProps {
  selectedBudget: Budget | null;
  availableBudgets: Budget[];
  users: User[];
  onBudgetSelect: (budgetId: string) => void;
}

export function BudgetSelector({
  selectedBudget,
  availableBudgets,
  users,
  onBudgetSelect,
}: BudgetSelectorProps) {
  const { selectedUserId } = useUserFilter();
  const showUserChip = !selectedUserId;
  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  return (
    <PageSection variant="card" padding="sm" className={budgetStyles.selectionSection}>
      {/* Section Header */}
      <SectionHeader
        title="Budget"
        subtitle="Seleziona per visualizzare i dettagli"
      />

      {/* Budget Selector Dropdown */}
      <div>
        <Select
          value={selectedBudget?.id || ''}
          onValueChange={onBudgetSelect}
        >
          <SelectTrigger className={budgetStyles.selector.trigger}>
            {selectedBudget ? (
              <div className={budgetStyles.selector.itemContent}>
                <div className={budgetStyles.selector.itemIcon}>
                  <CategoryIcon
                    categoryKey={selectedBudget.categories?.[0] || 'altro'}
                    size={iconSizes.sm}
                    className={budgetStyles.selector.itemIconContent}
                  />
                </div>
                <div className={budgetStyles.selector.itemTextRow}>
                  <span className={budgetStyles.selector.itemText}>
                    {selectedBudget.description}
                  </span>
                  {showUserChip && userMap.get(selectedBudget.user_id) && (
                    <span className={budgetStyles.selector.itemChip}>
                      {userMap.get(selectedBudget.user_id)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className={budgetStyles.selector.placeholder}>Seleziona budget</span>
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
                      categoryKey={budget.categories?.[0] || 'altro'}
                      size={iconSizes.sm}
                      className={budgetStyles.selector.itemIconContent}
                    />
                  </div>
                  <div className={budgetStyles.selector.itemTextRow}>
                    <span className={budgetStyles.selector.itemText}>
                      {budget.description}
                    </span>
                    {showUserChip && userMap.get(budget.user_id) && (
                      <span className={budgetStyles.selector.itemChip}>
                        {userMap.get(budget.user_id)}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </PageSection>
  );
}
