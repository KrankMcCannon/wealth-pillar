/**
 * IconContainer Primitive Component
 *
 * Centralized icon background with gradient
 * Replaces hardcoded icon container styles throughout the app
 *
 * @example
 * ```tsx
 * <IconContainer size="md" color="primary">
 *   <WalletIcon className="h-6 w-6" />
 * </IconContainer>
 * ```
 */

import * as React from "react";
import { cn, iconContainerVariants, IconContainerVariants } from '@/src/lib';

export interface IconContainerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    IconContainerVariants {
  /** Icon element to display */
  children: React.ReactNode;
}

export function IconContainer({
  size,
  color,
  className,
  children,
  ...props
}: IconContainerProps) {
  return (
    <div
      className={cn(iconContainerVariants({ size, color }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
