/**
 * PageHeader - Standardized page header
 */

"use client";

import { Text } from "../ui";
import { cn } from '@/src/lib';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex-1 min-w-0">
        <Text variant="heading" size="3xl" as="h1" className="mb-2">
          {title}
        </Text>
        {description && (
          <Text variant="muted" size="md">
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
  );
}
