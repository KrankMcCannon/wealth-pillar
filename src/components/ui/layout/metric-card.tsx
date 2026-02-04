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
import { metricCardStyles } from './theme/metric-card-styles';
import { cn } from '@/lib/utils';

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
                key={index}
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
