/**
 * Text Primitive Component
 *
 * Centralized typography component with semantic variants
 * Replaces hardcoded text-* classes throughout the app
 *
 * @example
 * ```tsx
 * <Text variant="heading" size="xl">Welcome</Text>
 * <Text variant="muted" size="sm">Helper text</Text>
 * ```
 */

import * as React from 'react';
import { cn, textVariants, type TextVariants } from '@/lib/utils';

export interface TextProps extends React.HTMLAttributes<HTMLElement>, TextVariants {
  /** HTML element to render */
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  /** Children content */
  children: React.ReactNode;
}

export function Text({
  as: Component = 'p',
  variant,
  size,
  className,
  children,
  ...props
}: Readonly<TextProps>) {
  return (
    <Component className={cn(textVariants({ variant, size }), className)} {...props}>
      {children}
    </Component>
  );
}
