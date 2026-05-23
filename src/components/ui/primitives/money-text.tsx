'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Amount, type AmountProps } from './amount';

export type MoneyTextVariant = 'default' | 'home-income' | 'home-expense';

interface MoneyTextProps {
  value: number;
  variant?: MoneyTextVariant;
  signed?: boolean;
  className?: string;
  amountProps?: Partial<AmountProps>;
  children?: ReactNode;
}

export function MoneyText({
  value,
  variant = 'default',
  signed = false,
  className,
  amountProps,
  children,
}: MoneyTextProps) {
  if (variant === 'home-income' || variant === 'home-expense') {
    const signPrefix = children != null ? null : signed ? (value >= 0 ? '+' : '-') : null;

    return (
      <span className={cn('inline-flex shrink-0 items-baseline gap-0 tabular-nums', className)}>
        {signPrefix ? <span aria-hidden>{signPrefix}</span> : null}
        <Amount
          type={variant === 'home-income' ? 'income' : 'expense'}
          size="sm"
          emphasis="subtle"
          {...amountProps}
        >
          {children != null
            ? typeof children === 'number' || typeof children === 'string'
              ? children
              : String(children)
            : Math.abs(value)}
        </Amount>
      </span>
    );
  }

  const display = children ?? value;

  return (
    <Amount
      type={value >= 0 ? 'income' : 'expense'}
      currency
      {...(className ? { className } : {})}
      {...amountProps}
    >
      {typeof display === 'number' || typeof display === 'string' ? display : String(display)}
    </Amount>
  );
}
