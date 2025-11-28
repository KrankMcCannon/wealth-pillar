"use client";

import React, { useState } from "react";
import { Card } from "@/src/components/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { reportsStyles } from "@/features/reports";
import { TransactionService, UserService } from "@/lib/services";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

/**
 * Category Breakdown Section
 * Shows top spending categories with percentages and trends
 * Expandable to show individual transactions
 */

export interface EnrichedCategoryMetric {
  name: string;
  amount: number;
  percentage: number;
  label?: string;
  color?: string;
  icon?: string;
  trend?: "up" | "down" | "stable";
}

export interface CategoryBreakdownProps {
  categories: EnrichedCategoryMetric[];
  allCategories?: any[]; // Full category list (optional, for future use)
  transactions?: Transaction[]; // All transactions for filtering by category
  users?: Array<{ id: string; name: string }>; // User data for displaying user names
  selectedUserId?: string; // Selected user ID from user selector ("all" or specific user ID)
  isLoading?: boolean;
}

export function CategoryBreakdownSection({
  categories,
  transactions = [],
  users = [],
  selectedUserId = "all",
  isLoading = false,
}: Readonly<CategoryBreakdownProps>) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card className={reportsStyles.card.container}>
        <div className={reportsStyles.categoryBreakdown.container}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${reportsStyles.skeleton.base} h-16`}></div>
          ))}
        </div>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className={reportsStyles.card.container}>
        <div className={reportsStyles.emptyState.container}>
          <p className={reportsStyles.emptyState.title}>Nessuna categoria</p>
          <p className={reportsStyles.emptyState.description}>
            Aggiungi transazioni per visualizzare le categorie di spesa
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={reportsStyles.card.container}>
      <div className={reportsStyles.categoryBreakdown.container}>
        {categories.slice(0, 5).map((category, index) => {
          const isExpanded = expandedCategories.has(category.name);
          // Only show expense transactions since category breakdown only counts expenses
          // Filter by category and optionally by selected user
          let categoryTransactions = transactions.length > 0
            ? TransactionService.filterByCategory(transactions, category.name, "expense")
            : [];

          // Further filter by user if a specific user is selected
          if (selectedUserId !== "all") {
            categoryTransactions = categoryTransactions.filter((t) => t.user_id === selectedUserId);
          }

          return (
            <div key={category.name || index} className={reportsStyles.categoryBreakdown.categoryRow}>
              {/* Category Header - Clickable */}
              <div className={reportsStyles.categoryBreakdown.categoryHeader} onClick={() => toggleCategory(category.name)}>
                <div className={reportsStyles.categoryBreakdown.categoryInfo}>
                  <div
                    className={reportsStyles.categoryBreakdown.categoryIcon}
                    style={{ backgroundColor: category.color ? `${category.color}20` : undefined }}
                  >
                    <span className="text-sm font-semibold" style={{ color: category.color }}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className={reportsStyles.categoryBreakdown.categoryDetails}>
                    <h4 className={reportsStyles.categoryBreakdown.categoryName}>{category.label || category.name}</h4>
                    <p className={reportsStyles.categoryBreakdown.categoryAmount}>
                      {formatCurrency(category.amount)} • {category.percentage.toFixed(1)}%
                    </p>
                    <div className={reportsStyles.categoryBreakdown.progressBar}>
                      <div
                        className={reportsStyles.categoryBreakdown.progressFill}
                        style={{
                          width: `${Math.min(category.percentage, 100)}%`,
                          backgroundColor: category.color || "#6366F1",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className={reportsStyles.categoryBreakdown.expandIcon}>
                  {isExpanded ? (
                    <ChevronUp className={reportsStyles.categoryBreakdown.expandIconExpanded} />
                  ) : (
                    <ChevronDown className={reportsStyles.categoryBreakdown.expandIconCollapsed} />
                  )}
                </div>
              </div>

              {/* Expandable Transaction List */}
              {isExpanded && categoryTransactions.length > 0 && (
                <div className={reportsStyles.categoryBreakdown.transactionList}>
                  {categoryTransactions.map((transaction) => (
                    <div key={transaction.id} className={reportsStyles.categoryBreakdown.transactionItem}>
                      <div className={reportsStyles.categoryBreakdown.transactionContent}>
                        <span className={reportsStyles.categoryBreakdown.transactionDescription}>
                          {transaction.description}
                        </span>
                        <span className={reportsStyles.categoryBreakdown.transactionMeta}>
                          {formatShortDate(transaction.date)} • {UserService.getUserName(transaction.user_id, users)}
                        </span>
                      </div>
                      <span className={reportsStyles.categoryBreakdown.transactionAmount}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state when expanded but no transactions */}
              {isExpanded && categoryTransactions.length === 0 && (
                <div className={reportsStyles.categoryBreakdown.transactionEmpty}>
                  <p className={reportsStyles.categoryBreakdown.transactionEmptyText}>Nessuna transazione trovata</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
