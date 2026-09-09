/**
 * Amount Primitive Component
 *
 * Centralized financial amount display with semantic colors
 * Automatically styles income/expense/balance amounts
 *
 * @example
 * ```tsx
 * <Amount type="income" size="lg">1234.56</Amount>
 * <Amount type="expense">-567.89</Amount>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, formatCurrency, toFiniteMoney } from '@/lib/utils';

const amountVariants = cva('font-bold tabular-nums', {
  variants: {
    type: {
      income: 'text-income',
      expense: 'text-expense',
      transfer: 'text-foreground',
      balance: 'text-primary',
      neutral: 'text-muted-foreground',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    emphasis: {
      default: '',
      strong: 'font-bold tracking-tight',
      subtle: 'font-semibold',
    },
  },
  defaultVariants: {
    type: 'balance',
    size: 'md',
    emphasis: 'default',
  },
});

export type AmountVariants = VariantProps<typeof amountVariants>;

export interface AmountProps extends React.HTMLAttributes<HTMLSpanElement>, AmountVariants {
  /** Amount value (number or string) */
  children: number | string;
  /** Format as currency with € symbol */
  currency?: boolean;
}

export function Amount({
  type,
  size,
  emphasis,
  currency = true,
  className,
  children,
  ...props
}: Readonly<AmountProps>) {
  const value = toFiniteMoney(children);
  const formatted = currency ? formatCurrency(value) : value.toFixed(2);

  return (
    <span className={cn(amountVariants({ type, size, emphasis }), className)} {...props}>
      {formatted}
    </span>
  );
}
