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
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      heading: 'text-heading',
      body: 'text-body',
      muted: 'text-muted-foreground',
      emphasis: 'text-text-emphasis font-semibold',
      subtle: 'text-subtle',
      primary: 'text-primary font-medium',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
  },
  defaultVariants: {
    variant: 'body',
    size: 'md',
  },
});

export type TextVariants = VariantProps<typeof textVariants>;

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
