/**
 * User Selector — tono vicino al design context: calmo, token-based, meno “chip anonime”.
 */

import type { CSSProperties } from 'react';

export const userSelectorStyles = {
  loading: {
    container: 'border-b border-border/50 bg-card/70 px-4 pb-3 pt-3 backdrop-blur-sm sm:px-5',
    heading: 'mb-2 h-3 w-28 rounded bg-muted/50 animate-pulse',
    list: 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide',
    item: 'flex min-h-[44px] min-w-[7.5rem] shrink-0 items-center gap-2 rounded-2xl border border-border/40 bg-muted/30 px-3 py-2 animate-pulse',
    avatar: 'size-8 shrink-0 rounded-full bg-muted/60',
    text: 'h-3.5 flex-1 rounded bg-muted/50',
  },
  container: 'border-b border-border/50 bg-card/80 px-4 pb-3 pt-3 backdrop-blur-sm sm:px-5',
  heading: 'mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
  list: 'flex items-stretch gap-2 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent',
  listStyle: {
    scrollbarWidth: 'thin',
  } satisfies CSSProperties,
  item: {
    base: 'group flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-sm font-medium outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:px-3.5',
    active:
      'border-primary/35 bg-primary/[0.1] text-foreground shadow-sm ring-1 ring-inset ring-primary/15 dark:bg-primary/15',
    inactive:
      'border-border/55 bg-muted/25 text-foreground/90 hover:border-primary/25 hover:bg-muted/40',
  },
  avatar: {
    base: 'flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-200',
    active: 'border-primary/30 bg-card text-primary',
    inactive: 'border-border/60 bg-card/90 text-primary/90',
    allIcon: 'size-4 text-primary',
  },
  initials: 'leading-none',
  label: 'max-w-[6.5rem] truncate sm:max-w-[7.5rem]',
  dots: {
    container: 'mt-2 flex justify-center gap-1.5',
    base: 'h-1 rounded-full transition-all duration-300',
    active: 'w-4 bg-primary/70',
    inactive: 'w-1.5 bg-muted-foreground/25',
  },
} as const;
