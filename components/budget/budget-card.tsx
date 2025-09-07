"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Budget } from "@/lib/types";
import { formatCurrency, getBudgetProgress, getBalanceSpent } from "@/lib/utils";

interface BudgetCardProps {
  budget: Budget;
  className?: string;
}

export function BudgetCard({ budget, className = '' }: BudgetCardProps) {
  const [progress, setProgress] = useState<number>(0);
  const [spent, setSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        const [progressValue, spentValue] = await Promise.all([
          getBudgetProgress(budget),
          getBalanceSpent(budget)
        ]);
        setProgress(progressValue);
        setSpent(spentValue);
      } catch (error) {
        console.error('Error loading budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetData();
  }, [budget]);

  const remaining = budget.amount - spent;
  const isOverBudget = progress > 100;

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Caricamento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-1">
              {budget.description}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {budget.categories.map((category) => (
                <Badge key={category} variant="outline" className="text-xs px-2 py-1">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-sm font-medium">
              {formatCurrency(budget.amount)}
            </div>
            <div className="text-xs text-muted-foreground">
              {budget.type}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Speso</span>
            <span className="font-medium">{formatCurrency(spent)}</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {isOverBudget ? 'Superato di' : 'Rimanente'}
            </span>
            <span className={`font-medium ${
              isOverBudget ? 'text-red-600' : remaining <= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {isOverBudget ? formatCurrency(Math.abs(remaining)) : formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}