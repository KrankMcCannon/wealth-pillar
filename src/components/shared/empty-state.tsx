'use client';

import { cn } from '@/lib';
import { LucideIcon } from 'lucide-react';
import { emptyStateStyles } from '@/styles/system';

/**
 * Empty State Component
 * Displays a consistent empty state message with optional icon and action
 */
interface EmptyStateProps {
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
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
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Readonly<EmptyStateProps>) {
  return (
    <div className={cn(emptyStateStyles.container, className)}>
      {Icon && (
        <div className={emptyStateStyles.iconWrapper}>
          <Icon className={emptyStateStyles.icon} />
        </div>
      )}
      <h3 className={emptyStateStyles.title}>{title}</h3>
      {description && <p className={emptyStateStyles.description}>{description}</p>}
      {action && <div className={emptyStateStyles.action}>{action}</div>}
    </div>
  );
}
