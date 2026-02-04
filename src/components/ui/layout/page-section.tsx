'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { layoutStyles } from '@/styles/system';

export interface PageSectionProps {
  children: React.ReactNode;
  variant?: 'plain' | 'card' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function PageSection({
  children,
  variant = 'plain',
  padding = 'none',
  className,
}: Readonly<PageSectionProps>) {
  return (
    <section
      className={cn(
        layoutStyles.section.container,
        layoutStyles.section.surface[variant],
        layoutStyles.section.padding[padding],
        className
      )}
    >
      {children}
    </section>
  );
}
