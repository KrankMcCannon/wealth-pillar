import type { CSSProperties } from 'react';

export const categoryStyles = {
  formModal: {
    form: 'min-h-0',
    error: 'px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md',
    colorSection: 'flex min-w-0 w-full flex-col gap-3',
    palette: 'grid w-full grid-cols-6 gap-2 sm:grid-cols-8',
    colorButton:
      'group relative min-h-11 min-w-0 rounded-lg border border-foreground/15 transition-colors duration-200',
    colorActive: 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
    colorIdle:
      'hover:ring-2 hover:ring-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
    colorDisabled: 'opacity-50 cursor-not-allowed',
    checkWrap: 'absolute inset-0 flex items-center justify-center',
    checkIcon: 'h-4 w-4 text-white drop-shadow-lg',
  },
} as const;

export function getCategoryColorStyle(color: string): CSSProperties {
  return { backgroundColor: color };
}
