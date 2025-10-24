/**
 * FormSection - Reusable form section with title
 *
 * Groups related form fields with optional title and description
 *
 * @example
 * ```tsx
 * <FormSection title="Personal Information" description="Your basic details">
 *   <FormField label="Name"><Input /></FormField>
 *   <FormField label="Email"><Input type="email" /></FormField>
 * </FormSection>
 * ```
 */

"use client";

import * as React from "react";
import { Separator, Text } from "@/components/ui";
import { cn } from "@/lib";

export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Form fields */
  children: React.ReactNode;
  /** Whether to show separator */
  showSeparator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  showSeparator = false,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <Text variant="heading" size="md" as="h3">
              {title}
            </Text>
          )}
          {description && (
            <Text variant="muted" size="sm">
              {description}
            </Text>
          )}
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      {showSeparator && <Separator className="my-6" />}
    </div>
  );
}
