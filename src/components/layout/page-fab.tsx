'use client';

import { Plus } from 'lucide-react';
import { stitchFab } from '@/styles/home-design-foundation';
import { cn } from '@/lib';

export interface PageFabProps {
  onClick: () => void;
  ariaLabel: string;
  testId?: string;
  className?: string;
  hidden?: boolean;
}

export function PageFab({ onClick, ariaLabel, testId, className, hidden }: Readonly<PageFabProps>) {
  if (hidden) return null;

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(stitchFab.pageAdd, className)}
      aria-label={ariaLabel}
    >
      <Plus className={stitchFab.pageAddIcon} aria-hidden />
    </button>
  );
}
