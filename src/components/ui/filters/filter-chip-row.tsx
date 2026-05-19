'use client';

import type { ReactNode } from 'react';
import { stitchTransactions } from '@/styles/home-design-foundation';

interface FilterChipRowProps {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}

export function FilterChipRow({
  children,
  'aria-label': ariaLabel,
  className,
}: FilterChipRowProps) {
  return (
    <div className={className ?? stitchTransactions.chipRow} role="toolbar" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
