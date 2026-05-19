'use client';

import { cn } from '@/lib/utils';
import { stitchTransactions } from '@/styles/home-design-foundation';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({ label, active = false, onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        stitchTransactions.chipBase,
        active ? stitchTransactions.chipActive : stitchTransactions.chipInactive,
        className
      )}
    >
      {label}
    </button>
  );
}
