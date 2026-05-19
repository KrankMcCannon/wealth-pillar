'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { stitchHome } from '@/styles/home-design-foundation';
import { Amount, type AmountProps } from './amount';

export type MoneyTextVariant = 'default' | 'home-income' | 'home-expense';

interface MoneyTextProps {
  value: number;
  variant?: MoneyTextVariant;
  signed?: boolean;
  className?: string;
  /** Use Amount primitive styling (default/list pages) */
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
  const locale = useLocale();
  const formatted = formatCurrencyLocale(Math.abs(value), locale);
  const display =
    children ?? (signed ? `${value >= 0 ? '+' : '-'}${formatted.replace(/^-/, '')}` : formatted);

  if (variant === 'home-income' || variant === 'home-expense') {
    return (
      <p
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          variant === 'home-income' ? stitchHome.amountIncome : stitchHome.amountExpense,
          className
        )}
      >
        {display}
      </p>
    );
  }

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
