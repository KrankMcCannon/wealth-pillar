/**
 * DomainCard - Generic card wrapper for domain entities
 *
 * Provides consistent card layout pattern with:
 * - Icon + Title + Subtitle
 * - Primary and secondary content areas
 * - Action areas
 * - Variant support
 *
 * Follows SOLID principles:
 * - Single Responsibility: Card layout structure only
 * - Open/Closed: Extensible via composition, closed for modification
 * - Dependency Inversion: Accepts children, no domain logic
 *
 * @example
 * ```tsx
 * <DomainCard
 *   icon={<WalletIcon />}
 *   title="Groceries"
 *   subtitle="Main Account"
 *   variant="interactive"
 *   onClick={() => handleClick()}
 *   primaryContent={<Amount type="expense" size="lg">-50.00</Amount>}
 *   secondaryContent={<StatusBadge status="success">Paid</StatusBadge>}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from '@/src/lib';
import { Card } from "../card";
import { IconContainer } from "../primitives";
import { Text } from '@/src/components/ui';

export interface DomainCardProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Icon size variant */
  iconSize?: "sm" | "md" | "lg" | "xl";
  /** Icon color variant */
  iconColor?: "primary" | "warning" | "destructive" | "success" | "muted" | "accent";
  /** Main title text */
  title: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** Additional detail text (below subtitle) */
  detail?: string;
  /** Primary content (typically displayed on the right) */
  primaryContent?: React.ReactNode;
  /** Secondary content (below primary content) */
  secondaryContent?: React.ReactNode;
  /** Card variant */
  variant?: "regular" | "interactive" | "highlighted" | "muted";
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Footer content (spans full width) */
  footer?: React.ReactNode;
  /** Whether card is in loading state */
  isLoading?: boolean;
  /** Whether card is disabled */
  isDisabled?: boolean;
  /** Test ID for testing */
  testId?: string;
  /** Optional actions element (e.g. dropdown menu) */
  actions?: React.ReactNode;
}

const variantStyles = {
  regular: "p-2 mb-2 bg-card/80 backdrop-blur-sm shadow-lg border border-border hover:shadow-xl",
  interactive: "p-2 mb-2 bg-card/80 backdrop-blur-sm shadow-lg border border-border hover:shadow-xl cursor-pointer hover:scale-[1.01]",
  highlighted: "p-2 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20",
  muted: "p-2 mb-2 bg-muted/50 border border-border/50",
};

export function DomainCard({
  icon,
  iconSize = "md",
  iconColor = "primary",
  title,
  subtitle,
  detail,
  primaryContent,
  secondaryContent,
  variant = "regular",
  onClick,
  className,
  footer,
  isLoading = false,
  isDisabled = false,
  testId,
  actions,
}: DomainCardProps) {
  const cardStyles = variantStyles[variant];
  const isInteractive = variant === "interactive" || onClick;

  return (
    <Card
      className={cn(
        cardStyles,
        "transition-all duration-300 rounded-2xl group",
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
      <div className="flex items-center justify-between">
        {/* Left Section: Icon + Text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <IconContainer
              size={iconSize}
              color={iconColor}
              className="rounded-xl shrink-0"
            >
              {icon}
            </IconContainer>
          )}

          <div className="flex-1 min-w-0">
            <Text
              variant="heading"
              size="sm"
              as="h3"
              className={cn(
                "truncate mb-1",
                isInteractive && "group-hover:text-primary/80 transition-colors"
              )}
            >
              {title}
            </Text>

            {(subtitle || detail) && (
              <div className="space-y-0.5">
                {subtitle && (
                  <Text variant="muted" size="xs" className="truncate">
                    {subtitle}
                  </Text>
                )}
                {detail && (
                  <Text variant="primary" size="xs" className="font-medium">
                    {detail}
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Primary & Secondary Content */}
        {(primaryContent || secondaryContent || actions) && (
          <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
            <div>
              {primaryContent && <div className="mb-1">{primaryContent}</div>}
              {secondaryContent && <div>{secondaryContent}</div>}
            </div>
            {actions && (
              <div onClick={(e) => e.stopPropagation()}>
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="mt-3 pt-3 border-t border-border/50">
          {footer}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </Card>
  );
}
