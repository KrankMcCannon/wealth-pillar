'use client';

import type { ReactNode } from 'react';
import { stitchTransactions } from '@/styles/home-design-foundation';

interface FilterChipRowProps {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
  role?: 'toolbar' | 'radiogroup';
}

export function FilterChipRow({
  children,
  'aria-label': ariaLabel,
  className,
  role = 'toolbar',
}: FilterChipRowProps) {
  return (
    <div className={className ?? stitchTransactions.chipRow} role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
