'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icon, iconSizes, getSemanticColor } from '@/lib/icons';

export interface CategoryBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  categoryKey: string;
  color?: string; // Icon color (HEX or CSS variable)
  backgroundColor?: string; // Optional override for background color
  size?: keyof typeof iconSizes;
}

const DEFAULT_COLOR = 'var(--color-primary)';

function isHexColor(value: string): boolean {
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{3}$/.test(trimmed) || /^#[0-9a-fA-F]{6}$/.test(trimmed);
}

/**
 * CategoryBadge - Category icon with semantic background.
 *
 * Lightweight icon wrapper used across reports, budgets, series, and transactions.
 */
export const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ categoryKey, color, backgroundColor, size = 'sm', className, style, ...props }, ref) => {
    const safeCategoryKey =
      typeof categoryKey === 'string' && categoryKey.trim() ? categoryKey : 'altro';
    const resolvedColor =
      typeof color === 'string' && color.trim()
        ? color
        : getSemanticColor(safeCategoryKey) || DEFAULT_COLOR;

    const resolvedBackground =
      typeof backgroundColor === 'string' && backgroundColor.trim()
        ? backgroundColor
        : resolvedColor;

    const computedBackground = isHexColor(resolvedBackground)
      ? `${resolvedBackground}20`
      : `color-mix(in srgb, ${resolvedBackground}, transparent 88%)`;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-xl shrink-0 p-1 transition-colors duration-200',
          size === 'xs' && 'size-6',
          size === 'sm' && 'size-8',
          size === 'md' && 'size-10',
          size === 'lg' && 'size-12',
          size === 'xl' && 'size-16',
          className
        )}
        style={{
          backgroundColor: computedBackground,
          color: resolvedColor,
          ...style,
        }}
        {...props}
      >
        <Icon
          icon={safeCategoryKey}
          size={iconSizes[size]}
          className="shrink-0"
          color={resolvedColor}
        />
      </div>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';
