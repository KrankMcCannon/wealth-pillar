"use client";

import React from "react";
import { Card } from "@/src/components/ui";
import { TrendingDown, TrendingUp } from "lucide-react";
import { reportsStyles } from "@/features/reports";

/**
 * Category Breakdown Section
 * Shows top spending categories with percentages and trends
 */

export interface CategoryBreakdownProps {
  categories: null[];
  isLoading?: boolean;
}

export function CategoryBreakdownSection({ categories, isLoading = false }: Readonly<CategoryBreakdownProps>) {
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
        {categories.slice(0, 5).map((category, index) => (
          <div key={index} className={reportsStyles.categoryBreakdown.item}>
            <div className={reportsStyles.categoryBreakdown.categoryInfo}>
              <div className={reportsStyles.categoryBreakdown.categoryIcon}>
                <span className="text-sm font-semibold">#{index + 1}</span>
              </div>
              <div className={reportsStyles.categoryBreakdown.categoryDetails}>
                <h4 className={reportsStyles.categoryBreakdown.categoryName}>{""}</h4>
                <p className={reportsStyles.categoryBreakdown.categoryAmount}>
                  {""} • {Number(0).toFixed(1)}%
                </p>
                <div className={reportsStyles.categoryBreakdown.progressBar}>
                  <div
                    className={reportsStyles.categoryBreakdown.progressFill}
                    style={{ width: `${Math.min(0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div
                className={`flex items-center gap-1 ${
                  "up" === "up" ? "text-red-600" : "down" === "down" ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                {(() => {
                  if ("up" === "up") {
                    return <TrendingUp className="h-4 w-4" />;
                  }
                  if ("down" === "down") {
                    return <TrendingDown className="h-4 w-4" />;
                  }
                  return null;
                })()}
                <span className="text-xs font-medium">{Math.abs(0).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
