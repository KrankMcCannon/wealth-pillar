export const investmentsStyles = {
  container: 'space-y-5 sm:space-y-8',
  card: {
    root: 'border-none shadow-md overflow-hidden',
    header: 'px-3 pt-3',
    headerWithBorder: 'px-3 pt-3 sm:px-4 sm:pt-4 border-b bg-primary/5',
    content: 'p-3',
    contentNoPadding: 'p-0',
    title: 'text-lg sm:text-xl text-primary',
    description: 'text-primary/70 text-sm sm:text-base',
  },
  charts: {
    grid: 'grid gap-4 sm:gap-6 grid-cols-1 min-w-0',
    container: 'h-[220px] min-h-[180px] w-full min-w-0 shrink-0 sm:h-[300px] sm:min-h-[260px]',
    sandboxContainer:
      'h-[280px] min-h-[200px] w-full min-w-0 shrink-0 sm:h-[360px] sm:min-h-[280px]',
    fallback:
      'flex h-[220px] min-h-[180px] sm:h-[300px] sm:min-h-[260px] items-center justify-center text-primary/50 bg-primary/5 rounded-lg px-3 text-center text-sm',
  },
  list: {
    item: 'flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 px-4 hover:bg-primary/5 transition-colors duration-200',
    itemContent: 'mb-2 sm:mb-0',
    itemTitle: 'font-semibold text-lg text-primary',
    badgeWrapper: 'flex items-center gap-2 mt-1',
    badge:
      'inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20',
    separator: 'text-sm text-primary/60',
    sharesText: 'text-sm text-primary/60',
    valueContainer:
      'text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-primary/5 sm:bg-transparent p-3 sm:p-0 rounded-lg',
    valuePrimary: 'font-bold text-xl text-primary',
    valueDetails: 'flex flex-row sm:flex-col justify-between sm:items-end gap-x-4',
    valueLabel: 'text-xs text-primary/60 mt-1',
    valueGain: (isPositive: boolean) =>
      `text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-destructive'}`,
  },
  sandbox: {
    grid: 'grid gap-4 sm:gap-6 md:grid-cols-3 p-4 sm:p-8 bg-card',
    inputGroup: 'space-y-3',
    label: 'text-sm font-medium text-primary/80',
    input: 'font-medium text-lg h-12 text-primary',
    chartSection: 'p-4 sm:p-6 border-t',
  },
};
