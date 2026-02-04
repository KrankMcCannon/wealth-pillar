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
import { cn, statusBadgeVariants, type StatusBadgeVariants } from '@/lib/utils';
import { statusBadgeStyles } from './theme/status-badge-styles';

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
      {showDot && <div className={statusBadgeStyles.dot} />}
      {children}
    </div>
  );
}
