/**
 * User selector — palette Stitch (homepage / transazioni / drawer gruppo).
 */

import type { CSSProperties } from 'react';

export const userSelectorStyles = {
  /** Trasparente quando il genitore è già una card Stitch (es. transazioni). */
  container: 'border-0 bg-transparent px-0 pb-0 pt-0 backdrop-blur-none',
  heading: 'mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[#8fb0ff]',
  list: 'flex touch-pan-x items-stretch gap-2 overflow-x-auto overscroll-x-contain scroll-pl-1 pb-0.5 [-webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-[#5c77cc]/30 scrollbar-track-transparent',
  listStyle: {
    scrollbarWidth: 'thin',
  } satisfies CSSProperties,
  item: {
    base: 'group flex min-h-11 min-w-[44px] shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 text-left text-[12px] font-medium tracking-wide outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050818] motion-reduce:transition-none sm:min-h-[48px] sm:px-3.5',
    active:
      'border-transparent bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
    inactive:
      'border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f] hover:text-[#e6ecff]',
  },
  avatar: {
    base: 'flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-200',
    active: 'border-[#5c77cc]/35 bg-[#2a447f] text-[#9eb6ff]',
    inactive: 'border-[#3359c5]/35 bg-[#11295f] text-[#9fb0d7]',
    allIcon: 'size-4 text-[#9eb6ff]',
  },
  initials: 'leading-none',
  label: 'max-w-[6.5rem] truncate text-[#e6ecff] sm:max-w-[7.5rem]',
  dots: {
    container: 'mt-2 flex max-w-full justify-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide',
    base: 'h-1 rounded-full transition-all duration-300',
    active: 'w-4 bg-[#8fb0ff]/80',
    inactive: 'w-1.5 bg-[#3359c5]/40',
  },
} as const;
