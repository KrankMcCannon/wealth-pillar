'use client';

import type { ReactNode } from 'react';
import { PageSection } from '@/components/ui/layout';
import { cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';

interface HomeSectionCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/**
 * Contenitore sezione Home (card blu Stitch): bordo, fondo, ombra coerenti.
 */
export function HomeSectionCard({ children, className, id, 'aria-label': ariaLabel }: HomeSectionCardProps) {
  return (
    <PageSection
      variant="plain"
      padding="none"
      className={cn(stitchHome.sectionCard, className)}
      {...(id !== undefined ? { id } : {})}
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
    >
      {children}
    </PageSection>
  );
}
