'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const sectionContainer = 'space-y-4';
const sectionSurface = {
  plain: 'bg-transparent',
  card: 'bg-card border border-border/20 rounded-2xl',
  muted: 'bg-muted border border-border/60 rounded-2xl',
} as const;
const sectionPadding = {
  none: '',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
} as const;

export interface PageSectionProps {
  children: React.ReactNode;
  variant?: 'plain' | 'card' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function PageSection({
  children,
  variant = 'plain',
  padding = 'none',
  className,
  id,
  'aria-label': ariaLabel,
}: Readonly<PageSectionProps>) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        sectionContainer,
        sectionSurface[variant],
        sectionPadding[padding],
        className
      )}
    >
      {children}
    </section>
  );
}
