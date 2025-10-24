/**
 * ListItem - Generic reusable list item component
 *
 * Provides consistent list item pattern with:
 * - Icon + Title + Description
 * - Actions area (right side)
 * - Hover and interactive states
 * - Variant support
 *
 * @example
 * ```tsx
 * <ListItem
 *   icon={<WalletIcon />}
 *   title="Main Account"
 *   description="€ 1,234.56 available"
 *   action={<Button size="sm">Edit</Button>}
 *   onClick={() => handleClick()}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from '@/src/lib';
import { IconContainer } from "../primitives";
import { Text } from '@/src/components/ui';

export interface ListItemProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Icon size variant */
  iconSize?: "sm" | "md" | "lg" | "xl";
  /** Icon color variant */
  iconColor?: "primary" | "warning" | "destructive" | "success" | "muted" | "accent";
  /** Main title text */
  title: string;
  /** Description or subtitle text */
  description?: string;
  /** Additional metadata text */
  metadata?: string;
  /** Action component (button, dropdown, etc.) */
  action?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether item is selected */
  isSelected?: boolean;
  /** Whether item is disabled */
  isDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export function ListItem({
  icon,
  iconSize = "md",
  iconColor = "primary",
  title,
  description,
  metadata,
  action,
  onClick,
  isSelected = false,
  isDisabled = false,
  className,
  testId,
}: ListItemProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className={cn(
        "px-3 py-2 transition-colors duration-200 rounded-lg",
        isInteractive && !isDisabled && "cursor-pointer hover:bg-accent/10",
        isSelected && "bg-primary/10 border-l-2 border-primary",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={!isDisabled ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive && !isDisabled ? 0 : undefined}
      onKeyDown={
        isInteractive && !isDisabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Section: Icon + Text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <IconContainer size={iconSize} color={iconColor} className="shrink-0">
              {icon}
            </IconContainer>
          )}

          <div className="flex-1 min-w-0">
            <Text
              variant="heading"
              size="sm"
              className={cn(
                "truncate",
                isSelected && "text-primary"
              )}
            >
              {title}
            </Text>

            {(description || metadata) && (
              <div className="space-y-0.5 mt-1">
                {description && (
                  <Text variant="muted" size="xs" className="truncate">
                    {description}
                  </Text>
                )}
                {metadata && (
                  <Text variant="subtle" size="xs" className="truncate">
                    {metadata}
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Action */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
