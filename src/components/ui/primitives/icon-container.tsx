/**
 * IconContainer Primitive Component
 *
 * Centralized icon background (solid token tints)
 * Replaces hardcoded icon container styles throughout the app
 *
 * @example
 * ```tsx
 * <IconContainer size="md" color="primary">
 *   <WalletIcon className="h-6 w-6" />
 * </IconContainer>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconContainerVariants = cva(
  'flex items-center justify-center rounded-2xl shadow-lg transition-all',
  {
    variants: {
      size: {
        sm: 'size-8',
        md: 'size-11',
        lg: 'size-14',
        xl: 'size-16',
      },
      color: {
        primary: 'bg-primary/10 text-primary',
        warning: 'bg-warning/10 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-success/10 text-success',
        muted: 'bg-primary/12 text-primary',
        accent: 'bg-accent/10 text-primary',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

export type IconContainerVariants = VariantProps<typeof iconContainerVariants>;

export interface IconContainerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>, IconContainerVariants {
  /** Icon element to display */
  children: React.ReactNode;
}

export function IconContainer({
  size,
  color,
  className,
  children,
  ...props
}: Readonly<IconContainerProps>) {
  return (
    <div className={cn(iconContainerVariants({ size, color }), className)} {...props}>
      {children}
    </div>
  );
}
