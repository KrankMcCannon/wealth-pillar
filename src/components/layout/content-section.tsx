/**
 * ContentSection - Content wrapper with optional title
 */

"use client";

import { Text } from "../ui";
import { cn } from "@/lib"

interface ContentSectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ContentSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName
}: ContentSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <Text variant="heading" size="xl" as="h2" className="mb-1">
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
