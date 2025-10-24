/**
 * FormLayout - Standardized form layout wrapper
 *
 * Provides consistent form structure with:
 * - Vertical spacing between fields
 * - Section grouping
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <FormLayout>
 *   <FormField label="Name">
 *     <Input />
 *   </FormField>
 *   <FormField label="Email">
 *     <Input type="email" />
 *   </FormField>
 * </FormLayout>
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib"

export interface FormLayoutProps {
  /** Form fields */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Form submission handler */
  onSubmit?: (e: React.FormEvent) => void;
}

export function FormLayout({
  children,
  className,
  onSubmit,
}: FormLayoutProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4", className)}
    >
      {children}
    </form>
  );
}
