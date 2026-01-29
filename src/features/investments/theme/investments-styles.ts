export const investmentsStyles = {
  container: "space-y-8",
  card: {
    root: "border-none shadow-md overflow-hidden",
    header: "px-6 pt-6",
    headerWithBorder: "px-6 pt-6 border-b bg-primary/5",
    content: "p-6",
    contentNoPadding: "p-0",
    title: "text-xl text-primary",
    description: "text-primary/70",
  },
  charts: {
    grid: "grid gap-8 grid-cols-1",
    container: "h-[350px] w-full min-w-0",
    sandboxContainer: "h-[400px] w-full min-w-0",
    fallback: "flex h-[350px] items-center justify-center text-primary/50 bg-primary/5 rounded-lg",
  },
  list: {
    item: "flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 px-4 hover:bg-primary/5 transition-colors duration-200",
    itemContent: "mb-2 sm:mb-0",
    itemTitle: "font-semibold text-lg text-primary",
    badgeWrapper: "flex items-center gap-2 mt-1",
    badge: "inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10",
    separator: "text-sm text-primary/60",
    sharesText: "text-sm text-primary/60",
    valueContainer: "text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-primary/5 sm:bg-transparent p-3 sm:p-0 rounded-lg",
    valuePrimary: "font-bold text-xl text-primary",
    valueDetails: "flex flex-row sm:flex-col justify-between sm:items-end gap-x-4",
    valueLabel: "text-xs text-primary/60 mt-1",
    valueGain: (isPositive: boolean) =>
      `text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-destructive'}`,
  },
  sandbox: {
    grid: "grid gap-8 md:grid-cols-3 p-8 bg-card",
    inputGroup: "space-y-3",
    label: "text-sm font-medium text-primary/80",
    input: "font-medium text-lg h-12 text-primary",
    chartSection: "p-6 border-t",
  }
};
