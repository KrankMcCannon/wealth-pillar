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

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  statusBadgeVariants,
  type StatusBadgeVariants,
} from "@/lib/ui-variants";

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    StatusBadgeVariants {
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
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {showDot && <div className="w-2 h-2 rounded-full bg-current shrink-0" />}
      {children}
    </div>
  );
}
