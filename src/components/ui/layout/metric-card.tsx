'use client';

/**
 * MetricCard - Unified Metric/Summary Card Component
 *
 * A flexible, reusable metric card component that supports:
 * - Header with label and optional icon
 * - Large value display with semantic color coding
 * - Optional description text
 * - Optional stats grid for sub-metrics
 * - Optional actions section
 * - Multiple variants (default, highlighted, success, warning, danger)
 * - Loading state support
 *
 * Used for: Account summaries, Budget metrics, Report overviews, Investments
 */

import { memo } from 'react';
import { Amount } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const metricCardStyles = {
  base: 'rounded-xl border bg-card p-3 transition-colors sm:p-4',
  variant: {
    default: 'border-primary/10',
    highlighted: 'border-primary/20 bg-primary/5',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
  },
  size: {
    sm: 'p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-5',
  },
  header: {
    container: 'flex items-center justify-between mb-1',
    labelRow: 'flex items-center gap-2',
    label: 'text-xs font-medium text-primary',
    iconContainer: 'w-6 h-6 rounded-lg flex items-center justify-center',
    iconColor: {
      primary: 'bg-primary/5 text-primary',
      success: 'bg-success/5 text-success',
      warning: 'bg-warning/5 text-warning',
      destructive: 'bg-destructive/5 text-destructive',
      muted: 'bg-primary/5 text-primary/60',
      accent: 'bg-primary/5 text-primary',
    },
  },
  value: {
    container: 'mb-1',
    text: 'font-bold',
    size: {
      sm: 'text-[11px]',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
    color: {
      income: 'text-success',
      expense: 'text-destructive',
      neutral: 'text-primary',
    },
  },
  description: 'text-[11px] mt-1',
  stats: {
    container: 'mt-2 pt-2 border-t border-primary/10 grid gap-2 sm:gap-3',
    gridCols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
    },
    item: 'flex items-center justify-between gap-2',
    itemBase: 'rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-2',
    itemVariant: {
      default: 'border-primary/10 bg-primary/5',
      primary: 'border-primary/15 bg-primary/8',
      success: 'border-success/15 bg-success/8',
      warning: 'border-warning/15 bg-warning/8',
      destructive: 'border-destructive/15 bg-destructive/8',
      muted: 'border-primary/10 bg-primary/5',
    },
    label: 'text-[11px] font-medium',
    labelVariant: {
      primary: 'text-primary/70',
      success: 'text-success/70',
      warning: 'text-warning/70',
      destructive: 'text-destructive/70',
      muted: 'text-primary/60',
    },
    value: 'text-xs font-semibold',
    valueVariant: {
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      destructive: 'text-destructive',
      muted: 'text-primary/60',
    },
  },
  actions: {
    container: 'mt-2 pt-2 border-t border-primary/10',
  },
  loading: {
    container: 'animate-pulse',
    label: 'h-3 bg-primary/10 rounded w-20',
    value: 'h-7 bg-primary/10 rounded w-24',
    stats: 'h-3 bg-primary/10 rounded w-16',
  },
  textTone: {
    default: 'text-primary/70',
    highlighted: 'text-primary/70',
    success: 'text-success/70',
    warning: 'text-warning/70',
    danger: 'text-destructive/70',
  },
  textToneStrong: {
    default: 'text-primary',
    highlighted: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  },
} as const;

export interface MetricCardStatItem {
  label: string;
  value: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

export interface MetricCardProps {
  // Header
  label: string;
  icon?: React.ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted' | 'accent';
  labelTone?: 'primary' | 'variant';

  // Main value
  value: number | React.ReactNode;
  valueType?: 'income' | 'expense' | 'neutral' | 'custom'; // For Amount component
  valueSize?: 'sm' | 'md' | 'lg' | 'xl';

  // Additional content
  description?: React.ReactNode | string;
  stats?: MetricCardStatItem[]; // Sub-metrics grid

  // Actions
  actions?: React.ReactNode;

  // Variants
  variant?: 'default' | 'highlighted' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';

  // State
  isLoading?: boolean;
  className?: string;
}

/**
 * MetricCard Component
 *
 * Provides a unified metric display pattern with optional stats grid.
 * Designed for financial data with semantic color coding.
 */
export const MetricCard = memo(
  ({
    label,
    icon,
    iconColor = 'primary',
    labelTone = 'primary',
    value,
    valueType = 'neutral',
    valueSize = 'lg',
    description,
    stats,
    actions,
    variant = 'default',
    size = 'md',
    isLoading = false,
    className,
  }: MetricCardProps) => {
    // Build class names
    const cardClasses = cn(
      metricCardStyles.base,
      metricCardStyles.variant[variant],
      metricCardStyles.size[size],
      className
    );

    const iconContainerClasses = cn(
      metricCardStyles.header.iconContainer,
      metricCardStyles.header.iconColor[iconColor]
    );

    const subTextClasses = metricCardStyles.textTone[variant];
    const subTextStrongClasses = metricCardStyles.textToneStrong[variant];

    const valueClasses = cn(
      metricCardStyles.value.text,
      metricCardStyles.value.size[valueSize],
      valueType !== 'custom' && metricCardStyles.value.color[valueType]
    );

    // Loading state
    if (isLoading) {
      return (
        <div className={cardClasses}>
          <div className={metricCardStyles.loading.container}>
            <div className="flex items-center justify-between mb-3">
              <div className={metricCardStyles.loading.label} />
            </div>
            <div className={metricCardStyles.loading.value} />
            {stats && stats.length > 0 && (
              <div
                className={cn(
                  metricCardStyles.stats.container,
                  metricCardStyles.stats.gridCols[Math.min(stats.length, 3) as 1 | 2 | 3]
                )}
              >
                {stats.map((_, index) => (
                  <div key={index} className={metricCardStyles.stats.item}>
                    <div className={metricCardStyles.loading.stats} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={cardClasses}>
        {/* Header */}
        <div className={metricCardStyles.header.container}>
          <div className={metricCardStyles.header.labelRow}>
            {icon && <div className={iconContainerClasses}>{icon}</div>}
            <span
              className={cn(
                metricCardStyles.header.label,
                labelTone === 'variant' && subTextStrongClasses
              )}
            >
              {label}
            </span>
          </div>
          {/* Actions can go in header if needed */}
        </div>

        {/* Main Value */}
        <div className={metricCardStyles.value.container}>
          {typeof value === 'number' ? (
            valueType === 'custom' ? (
              <div className={valueClasses}>{value}</div>
            ) : (
              <Amount type={valueType} size={valueSize} emphasis="strong" className={valueClasses}>
                {Math.abs(value)}
              </Amount>
            )
          ) : (
            <div className={valueClasses}>{value}</div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className={cn(metricCardStyles.description, subTextClasses)}>{description}</p>
        )}

        {/* Stats Grid */}
        {stats && stats.length > 0 && (
          <div
            className={cn(
              metricCardStyles.stats.container,
              metricCardStyles.stats.gridCols[Math.min(stats.length, 3) as 1 | 2 | 3]
            )}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label ?? `stat-${index}`}
                className={cn(
                  metricCardStyles.stats.item,
                  metricCardStyles.stats.itemBase,
                  stat.variant
                    ? metricCardStyles.stats.itemVariant[stat.variant]
                    : metricCardStyles.stats.itemVariant.default
                )}
              >
                <span
                  className={cn(
                    metricCardStyles.stats.label,
                    stat.variant
                      ? metricCardStyles.stats.labelVariant[stat.variant]
                      : subTextClasses
                  )}
                >
                  {stat.label}
                </span>
                <span
                  className={cn(
                    metricCardStyles.stats.value,
                    stat.variant
                      ? metricCardStyles.stats.valueVariant[stat.variant]
                      : subTextStrongClasses
                  )}
                >
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && <div className={metricCardStyles.actions.container}>{actions}</div>}
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';
