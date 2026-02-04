/**
 * Year Selector Styles
 * Centralized classNames for YearSelector component
 */

export const yearSelectorStyles = {
  loading: {
    container: 'bg-card/80 backdrop-blur-xl p-2 border-b border-primary/20 shadow-sm',
    list: 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide',
    item: 'shrink-0 flex items-center gap-2 p-2 rounded-2xl bg-primary/10 border border-primary/20 min-w-[100px] animate-pulse',
    icon: 'w-5 h-5 bg-primary/20 rounded-full',
    text: 'w-12 h-4 bg-primary/15 rounded',
  },
  container: 'bg-card/80 backdrop-blur-xl py-3 border-b border-primary/20 shadow-sm',
  list: 'flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 scrollbar-thumb-rounded-full pl-4',
  listStyle: {
    scrollbarWidth: 'thin',
    height: '44px',
  },
  item: {
    base: 'shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 group hover:scale-[1.02] focus:outline-none',
    active: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105',
    inactive:
      'bg-primary/10 backdrop-blur-sm text-primary hover:bg-primary/12 hover:text-primary hover:shadow-sm hover:shadow-primary/10',
  },
  icon: {
    containerBase:
      'flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 group-hover:scale-105',
    containerActive: 'bg-primary/15 backdrop-blur-sm',
    containerInactive: 'bg-primary/20',
    svgBase: 'w-3.5 h-3.5 transition-colors duration-200',
    svgActive: 'text-primary-foreground',
    svgInactive: 'text-primary',
  },
  label: 'transition-all duration-200',
  hoverIndicator:
    'w-0 h-2 bg-primary/40 rounded-full transition-all duration-300 group-hover:w-2 shrink-0',
  dots: {
    container: 'flex justify-center mt-2 gap-1',
    base: 'w-1.5 h-1.5 rounded-full transition-all duration-300',
    active: 'bg-primary w-4',
    inactive: 'bg-muted-foreground/30',
  },
} as const;
