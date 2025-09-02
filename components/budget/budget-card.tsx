"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetPeriods, BudgetCardProps } from "@/lib/types";
import { getBudgetPeriod, getCategoryIcon, getProgressColor, getStatusColor } from "@/lib/utils";

export function BudgetCard({ budget, variant = 'compact', className = '' }: BudgetCardProps) {
  const period = getBudgetPeriod(budget);
  const percentage = budget.percentage_used || 0;
  const isOverBudget = percentage > 100;
  const remainingDays = Math.ceil(
    (new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={`liquid-glass morph-card liquid-shimmer hover-glass ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-1">
              {budget.description}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {budget.categories.map((category) => (
                <Badge key={category} variant="outline" className="text-xs px-2 py-1">
                  <span className="mr-1">{getCategoryIcon(category)}</span>
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-sm font-medium">
              €{budget.amount.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {BudgetPeriods[budget.period]}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Speso</p>
            <p className="font-semibold text-finance-negative">
              €{budget.spent_amount?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {isOverBudget ? 'Sforamento' : 'Rimanente'}
            </p>
            <p className={`font-semibold ${
              isOverBudget ? 'text-finance-negative' : 'text-finance-positive'
            }`}>
              €{Math.abs(budget.remaining_amount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Progresso Budget</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold px-3 py-1 rounded-full text-xs ${getStatusColor(percentage)}`}>
                {percentage.toFixed(1)}%
              </span>
              {percentage >= 100 && (
                <span className="text-xs text-finance-negative font-medium">SUPERATO</span>
              )}
            </div>
          </div>
          
          {/* Main Progress Container */}
          <div className="relative">
            <div className="w-full bg-muted rounded-full h-4 shadow-inner liquid-glass-subtle">
              {/* Primary Progress Bar */}
              <div
                className={`h-4 rounded-full transition-all duration-700 ease-out shadow-lg liquid-pulse ${getProgressColor(percentage)}`}
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  background: percentage >= 100 
                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                    : percentage >= 80
                    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                    : percentage >= 60
                    ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                    : 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                }}
              />
              
              {/* Overflow indicator */}
              {percentage > 100 && (
                <div className="absolute top-0 left-0 w-full h-3 rounded-full overflow-hidden pointer-events-none">
                  <div className="w-full h-full bg-finance-negative-subtle rounded-full liquid-glass-subtle">
                    <div
                      className="h-full bg-gradient-danger rounded-full animate-pulse"
                      style={{ width: `${Math.min(percentage, 150)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Progress markers */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                {/* 50% marker */}
                <div className="absolute left-1/2 w-0.5 h-5 bg-muted-foreground/30 -translate-x-0.5 -translate-y-1"></div>
                {/* 80% marker */}
                <div className="absolute left-4/5 w-0.5 h-4 bg-finance-warning -translate-x-0.5 -translate-y-0.5"></div>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€0</span>
            <span className="text-center">50%</span>
            <span className="text-center text-finance-warning">80%</span>
            <span>€{budget.amount.toFixed(0)}</span>
          </div>
        </div>

        {variant === 'detailed' && (
          <>
            {/* Period Information */}
            <div className="border-t pt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Periodo inizio:</span>
                <span className="font-medium">
                  {new Date(period.start_date).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Periodo fine:</span>
                <span className="font-medium">
                  {new Date(period.end_date).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Giorni rimanenti:</span>
                <span className={`font-medium ${remainingDays <= 7 ? 'text-finance-warning' : ''}`}>
                  {remainingDays} giorni
                </span>
              </div>
            </div>

            {/* Daily Average */}
            <div className="border-t pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media giornaliera spesa:</span>
                <span className="font-medium">
                  €{((budget.spent_amount || 0) / Math.max(1, 31 - remainingDays)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget giornaliero rimanente:</span>
                <span className={`font-medium ${isOverBudget ? 'text-finance-negative' : 'text-finance-positive'}`}>
                  €{Math.max(0, (budget.remaining_amount || 0) / Math.max(1, remainingDays)).toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Status Messages */}
        {percentage >= 100 && (
          <div className="border-t pt-3">
            <div className="text-xs text-finance-negative bg-finance-negative-subtle p-3 rounded-xl liquid-glass-subtle border border-finance-negative/20">
              ⚠️ Budget superato di €{Math.abs(budget.remaining_amount || 0).toFixed(2)}
            </div>
          </div>
        )}
        
        {percentage >= 80 && percentage < 100 && (
          <div className="border-t pt-3">
            <div className="text-xs text-finance-warning bg-finance-warning-subtle p-3 rounded-xl liquid-glass-subtle border border-finance-warning/20">
              ⚡ Attenzione: budget quasi esaurito ({(100 - percentage).toFixed(1)}% rimanente)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}