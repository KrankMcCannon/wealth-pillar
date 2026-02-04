import type { CSSProperties } from 'react';

export const categoryStyles = {
  formModal: {
    form: 'space-y-4',
    error:
      'px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md',
    colorSection: 'space-y-3',
    palette: 'grid grid-cols-8 gap-2',
    colorButton: 'group relative aspect-square rounded-lg transition-all duration-200',
    colorActive: 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110',
    colorIdle:
      'hover:scale-105 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background',
    colorDisabled: 'opacity-50 cursor-not-allowed',
    checkWrap: 'absolute inset-0 flex items-center justify-center',
    checkIcon: 'h-4 w-4 text-white drop-shadow-lg',
  },
} as const;

export function getCategoryColorStyle(color: string): CSSProperties {
  return { backgroundColor: color };
}
