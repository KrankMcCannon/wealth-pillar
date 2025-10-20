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
import { cn } from "@/lib/utils";
import {
  iconContainerVariants,
  type IconContainerVariants,
} from "@/lib/ui-variants";

export interface IconContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
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
