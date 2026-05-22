'use client';

import { cn } from '@/lib';
import { LucideIcon } from 'lucide-react';
import { stitchHome } from '@/styles/home-design-foundation';
import { budgetStyles } from '@/features/budgets/theme/budget-styles';
import { emptyStateStyles } from '@/components/shared/theme/empty-state-styles';

/**
 * Empty State Component
 * Displays a consistent empty state message with optional icon and action
 */
export type EmptyStateVariant = 'default' | 'dashboard' | 'surface';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** id sull’heading per aria-labelledby della sezione contenitore */
  titleId?: string;
  /** Optional description text */
  description?: string;
  /** Optional action button or element */
  action?: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

/**
 * EmptyState Component
 * Reusable component for displaying empty states across the app
 *
 * @example
 * ```tsx
 * import { FileText } from "lucide-react";
 * import { EmptyState } from "@/components/shared";
 *
 * <EmptyState
 *   icon={FileText}
 *   title="Nessuna Transazione"
 *   description="Non ci sono transazioni per il periodo selezionato"
 * />
 * ```
 */
const variantClassName: Record<EmptyStateVariant, string> = {
  default: emptyStateStyles.container,
  dashboard: stitchHome.emptyWell,
  surface: budgetStyles.section.emptyContainer,
};

export function EmptyState({
  variant = 'default',
  icon: Icon,
  title,
  titleId,
  description,
  action,
  className,
}: Readonly<EmptyStateProps>) {
  if (variant === 'dashboard' && !Icon && !action) {
    return (
      <p className={cn(stitchHome.emptyWell, className)} id={titleId}>
        {description ? `${title} — ${description}` : title}
      </p>
    );
  }

  return (
    <div className={cn(variantClassName[variant], className)}>
      {Icon && (
        <div className={emptyStateStyles.iconWrapper}>
          <Icon className={emptyStateStyles.icon} />
        </div>
      )}
      <h3 id={titleId} className={emptyStateStyles.title}>
        {title}
      </h3>
      {description && <p className={emptyStateStyles.description}>{description}</p>}
      {action && <div className={emptyStateStyles.action}>{action}</div>}
    </div>
  );
}
