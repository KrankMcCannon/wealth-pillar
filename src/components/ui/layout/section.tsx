/**
 * Section - Generic content section wrapper
 *
 * Provides consistent section layout with:
 * - Title and description
 * - Action area (typically buttons)
 * - Consistent spacing
 * - Variant support
 *
 * @example
 * ```tsx
 * <Section
 *   title="Recent Transactions"
 *   description="Your latest financial activity"
 *   action={<Button>View All</Button>}
 * >
 *   <TransactionList />
 * </Section>
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib"
import { Text } from "@/components/ui";

export interface SectionProps {
  /** Section title */
  title?: string;
  /** Section description or subtitle */
  description?: string;
  /** Action component (typically buttons) */
  action?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** Whether to add bottom spacing */
  spacing?: "none" | "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Additional classes for header */
  headerClassName?: string;
  /** Additional classes for content */
  contentClassName?: string;
}

const spacingStyles = {
  none: "",
  sm: "mb-4",
  md: "mb-6",
  lg: "mb-8",
};

export function Section({
  title,
  description,
  action,
  children,
  spacing = "md",
  className,
  headerClassName,
  contentClassName,
}: SectionProps) {
  const hasHeader = title || description || action;

  return (
    <section className={cn(spacingStyles[spacing], className)}>
      {hasHeader && (
        <div
          className={cn(
            "flex items-start justify-between gap-4 mb-4",
            headerClassName
          )}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <Text
                variant="heading"
                size="xl"
                as="h2"
                className="mb-1"
              >
                {title}
              </Text>
            )}
            {description && (
              <Text variant="muted" size="sm">
                {description}
              </Text>
            )}
          </div>

          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
}
