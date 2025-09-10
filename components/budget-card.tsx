"use client";

import { CategoryIcon, iconSizes } from '@/lib/icons';
import { formatCurrency } from "@/lib/utils";
import { Budget } from "@/lib/types";

interface BudgetCardProps {
  budget: Budget;
  budgetInfo?: {
    id: string;
    spent: number;
    remaining: number;
    progress: number;
  };
  onClick: () => void;
}

export function BudgetCard({ budget, budgetInfo, onClick }: BudgetCardProps) {
  const getBudgetStatus = (progress: number) => {
    if (progress >= 100) return { color: 'rose', label: 'Superato', textColor: 'text-rose-600' };
    if (progress >= 80) return { color: 'amber', label: 'Attenzione', textColor: 'text-amber-600' };
    return { color: 'emerald', label: 'In regola', textColor: 'text-emerald-600' };
  };

  const getBudgetProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-gradient-to-r from-rose-500 to-rose-600';
    if (progress >= 80) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  };

  const getStatusDotColor = (progress: number) => {
    if (progress >= 100) return 'bg-rose-500';
    if (progress >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const remaining = budgetInfo?.remaining || budget.amount;

  return (
    <div
      className="px-3 py-2 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
            <CategoryIcon
              categoryKey={budget.categories?.[0] || 'altro'}
              size={iconSizes.md}
              className="budget-icon"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm truncate max-w-[140px] sm:max-w-[160px] mb-1">
              {budget.description}
            </h3>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/80 w-fit">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(budgetInfo?.progress || 0)}`} />
              <span className={`text-xs font-bold ${getBudgetStatus(budgetInfo?.progress || 0).textColor}`}>
                {Math.round(100 - (budgetInfo?.progress || 0))}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          <p className={`text-sm font-bold ${getBudgetStatus(budgetInfo?.progress || 0).textColor}`}>
            {formatCurrency(remaining)}
          </p>
          <p className="text-xs font-medium">
            di {formatCurrency(budget.amount)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-sm relative ${getBudgetProgressColor(budgetInfo?.progress || 0)}`}
            style={{ width: `${Math.min(budgetInfo?.progress || 0, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-full"></div>
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}