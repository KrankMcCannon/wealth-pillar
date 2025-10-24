/**
 * EmptyState - Standardized empty state component
 *
 * Provides consistent empty state UI with:
 * - Icon
 * - Title and description
 * - Optional action button
 * - Size variants
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FileXIcon />}
 *   title="No transactions found"
 *   description="Add your first transaction to get started"
 *   action={<Button onClick={onCreate}>Add Transaction</Button>}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib"
import { IconContainer } from "../primitives";
import { Text } from "@/components/ui";

export interface EmptyStateProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Icon size variant */
  iconSize?: "lg" | "xl";
  /** Icon color variant */
  iconColor?: "muted" | "primary" | "warning";
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action component (typically a button) */
  action?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: "py-8",
    iconSize: "lg" as const,
    titleSize: "lg" as const,
    descSize: "sm" as const,
  },
  md: {
    container: "py-12",
    iconSize: "xl" as const,
    titleSize: "xl" as const,
    descSize: "md" as const,
  },
  lg: {
    container: "py-16",
    iconSize: "xl" as const,
    titleSize: "2xl" as const,
    descSize: "lg" as const,
  },
};

export function EmptyState({
  icon,
  iconSize,
  iconColor = "muted",
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const styles = sizeStyles[size];
  const finalIconSize = iconSize || styles.iconSize;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      {icon && (
        <IconContainer
          size={finalIconSize}
          color={iconColor}
          className="mb-4"
        >
          {icon}
        </IconContainer>
      )}

      <Text
        variant="heading"
        size={styles.titleSize}
        className="mb-2"
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="muted"
          size={styles.descSize}
          className="mb-6 max-w-md"
        >
          {description}
        </Text>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
