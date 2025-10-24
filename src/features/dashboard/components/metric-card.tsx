/**
 * MetricCard - Generic metric display card
 */

"use client";

import { Amount, Card, IconContainer, Text } from '@/src/components/ui';
import { cn } from '@/src/lib';

interface MetricCardProps {
  label: string;
  value: number;
  trend?: number;
  icon?: React.ReactNode;
  type?: "income" | "expense" | "neutral" | "balance";
  showCurrency?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  icon,
  type = "neutral",
  showCurrency = true,
  className
}: MetricCardProps) {
  return (
    <Card className={cn("p-4 hover:shadow-lg transition-all", className)}>
      <div className="flex items-start justify-between mb-3">
        <Text variant="muted" size="sm">
          {label}
        </Text>
        {icon && (
          <IconContainer size="sm" color="primary">
            {icon}
          </IconContainer>
        )}
      </div>

      {showCurrency ? (
        <Amount type={type} size="2xl" emphasis="strong" className="mb-1">
          {value}
        </Amount>
      ) : (
        <Text variant="heading" size="2xl" className="mb-1">
          {value}
        </Text>
      )}

      {trend !== undefined && (
        <Text
          variant="muted"
          size="xs"
          className={cn(
            trend > 0 && "text-success",
            trend < 0 && "text-destructive"
          )}
        >
          {trend > 0 ? "+" : ""}{trend}%
        </Text>
      )}
    </Card>
  );
}
