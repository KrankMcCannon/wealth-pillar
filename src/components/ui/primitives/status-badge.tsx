/**
 * StatusBadge Primitive Component
 *
 * Centralized status indicator with semantic colors
 * Used for budget progress, transaction states, etc.
 *
 * @example
 * ```tsx
 * <StatusBadge status="success" showDot>
 *   In regola
 * </StatusBadge>
 * <StatusBadge status="warning" size="sm">
 *   78%
 * </StatusBadge>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-bold transition-colors',
  {
    variants: {
      status: {
        success: 'bg-success/10 text-success border border-success/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        danger: 'bg-destructive/10 text-destructive border border-destructive/20',
        neutral: 'bg-primary/10 text-primary border border-primary/20',
        info: 'bg-accent/10 text-primary border border-accent/20',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'md',
    },
  }
);

const statusBadgeDot = 'w-2 h-2 rounded-full bg-current shrink-0';

export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, StatusBadgeVariants {
  /** Badge content */
  children: React.ReactNode;
  /** Show status dot indicator */
  showDot?: boolean;
}

export function StatusBadge({
  status,
  size,
  showDot = false,
  className,
  children,
  ...props
}: Readonly<StatusBadgeProps>) {
  return (
    <div className={cn(statusBadgeVariants({ status, size }), className)} {...props}>
      {showDot && <div className={statusBadgeDot} />}
      {children}
    </div>
  );
}
