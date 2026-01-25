/**
 * Tab Navigation Styles
 * Centralized classNames for TabNavigation component
 */

export const tabNavigationStyles = {
  container: {
    underline: 'flex border-b border-primary/20 px-4 gap-8 pb-1',
    pills: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
    modern: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
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
  },
  icon: 'mr-2',
} as const;
