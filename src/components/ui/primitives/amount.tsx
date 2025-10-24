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

import * as React from "react";
import { amountVariants, AmountVariants, cn, formatCurrency } from '@/src/lib';

export interface AmountProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    AmountVariants {
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
}: AmountProps) {
  const value = typeof children === "number" ? children : parseFloat(children);
  const formatted = currency ? formatCurrency(value) : value.toFixed(2);

  return (
    <span
      className={cn(amountVariants({ type, size, emphasis }), className)}
      {...props}
    >
      {formatted}
    </span>
  );
}
