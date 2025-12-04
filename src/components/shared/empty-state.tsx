"use client";

import { cn } from "@/lib";
import { LucideIcon } from "lucide-react";

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
  className
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center", className)}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
