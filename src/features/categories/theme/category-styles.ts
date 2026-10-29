import type { CSSProperties } from 'react';

export const categoryStyles = {
  formModal: {
    form: 'space-y-4',
    error: 'px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md',
    colorSection: 'flex flex-col gap-3',
    palette: 'grid grid-cols-8 gap-2',
    colorButton: 'group relative aspect-square rounded-lg transition-all duration-200',
    colorActive: 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-modal-surface',
    colorIdle:
      'hover:scale-105 hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 hover:ring-offset-modal-surface',
    colorDisabled: 'opacity-50 cursor-not-allowed',
    checkWrap: 'absolute inset-0 flex items-center justify-center',
    checkIcon: 'h-4 w-4 text-white drop-shadow-lg',
  },
} as const;

export function getCategoryColorStyle(color: string): CSSProperties {
  return { backgroundColor: color };
}
