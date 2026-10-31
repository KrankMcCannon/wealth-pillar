'use client';

import { cn } from '@/lib/utils';
import { stitchTransactions } from '@/styles/home-design-foundation';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  /** Exclusive choice in a radiogroup. Default is a pressed toggle. */
  role?: 'radio';
  tabIndex?: number;
}

export function FilterChip({
  label,
  active = false,
  onClick,
  className,
  role,
  tabIndex,
}: FilterChipProps) {
  const isRadio = role === 'radio';

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={tabIndex}
      className={cn(
        stitchTransactions.chipBase,
        active ? stitchTransactions.chipActive : stitchTransactions.chipInactive,
        className
      )}
      {...(isRadio
        ? { role: 'radio' as const, 'aria-checked': active }
        : { 'aria-pressed': active })}
    >
      {label}
    </button>
  );
}
