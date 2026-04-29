/**
 * Tab Navigation Styles
 * Centralized classNames for TabNavigation component
 */

import { stitchTransactions } from '@/styles/home-design-foundation';

export const tabNavigationStyles = {
  container: {
    underline: 'flex border-b border-primary/20 px-4 gap-8 pb-1',
    pills: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
    modern: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
    /** Segment control dark — continuità con stitchTransactions (pagina Transazioni). */
    stitch:
      'flex w-full gap-1 rounded-full border border-[#3359c5]/35 bg-[#11295f]/85 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
  },
  tab: {
    underline: {
      base: 'flex flex-col items-center justify-center border-b-2 pb-[13px] pt-4 flex-1 transition-colors',
      active: 'border-b-primary text-primary',
      inactive: 'border-b-transparent text-primary/70 hover:text-primary',
      label: 'text-sm font-semibold leading-normal',
    },
    pills: {
      base: 'flex-1 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-300',
      active: 'bg-primary text-primary-foreground shadow-lg',
      inactive: 'text-primary/70 hover:text-primary hover:bg-primary/5',
    },
    modern: {
      base: 'flex-1 py-3 px-6 text-sm font-semibold rounded-full transition-all duration-300 group',
      active: 'bg-primary text-primary-foreground shadow-lg rounded-full',
      inactive: 'text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full',
    },
    stitch: {
      base: `flex-1 min-h-11 rounded-full px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35`,
      active: stitchTransactions.chipActive,
      inactive: stitchTransactions.chipInactive,
    },
  },
  icon: 'mr-2',
} as const;
