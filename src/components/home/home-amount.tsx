'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';

interface HomeAmountProps {
  variant: 'income' | 'expense';
  children: ReactNode;
  className?: string;
}

/** Importo in tabella con palette entrata/uscita Home. */
export function HomeAmount({ variant, children, className }: HomeAmountProps) {
  return (
    <p
      className={cn(
        'shrink-0 text-sm font-semibold tabular-nums',
        variant === 'income' ? stitchHome.amountIncome : stitchHome.amountExpense,
        className
      )}
    >
      {children}
    </p>
  );
}
