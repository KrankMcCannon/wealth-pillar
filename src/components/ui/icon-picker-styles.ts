export const iconPickerStyles = {
  // Container styles
  container: 'flex flex-col h-full min-h-0',

  // Header styles
  header: {
    base: 'border-b border-primary/20 bg-card/50 backdrop-blur-sm shrink-0 space-y-2',
    mobile: 'p-2',
    desktop: 'p-3',
  },

  // Search input wrapper
  searchWrapper: 'relative',
  searchInput: 'h-10 bg-card pr-8',
  searchClearButton:
    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary/10 transition-colors',
  searchClearIcon: 'h-4 w-4 text-primary/60',

  // Recent icons container
  recentContainer:
    'flex-1 flex gap-1 items-center px-2 text-xs text-primary/80 bg-primary/10 rounded-md overflow-hidden',
  recentIcon: 'h-3.5 w-3.5 shrink-0',
  recentLabel: 'shrink-0',
  recentIconsWrapper: 'flex gap-1 overflow-x-auto',
  recentIconButton: 'p-0.5 rounded hover:bg-primary/10 transition-colors shrink-0',
  recentIconSize: 'h-3.5 w-3.5 text-primary',

  // Category tabs
  tabsContainer: 'border-b border-primary/20 bg-card/30 backdrop-blur-sm overflow-x-auto',
  tabsList: 'inline-flex h-10 w-full justify-start rounded-none bg-transparent p-0',
  tabsTrigger:
    'relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary/60 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:bg-transparent px-3 text-xs whitespace-nowrap',

  // Results count
  resultsCount: {
    base: 'py-1.5 text-xs text-primary/80 bg-primary/10 shrink-0',
    mobile: 'px-2',
    desktop: 'px-3',
  },

  // Virtualized grid container
  gridContainer: 'overflow-y-auto overflow-x-hidden flex-1 min-h-0',

  // Empty state
  emptyState: 'flex flex-col items-center justify-center h-full py-8 text-center',
  emptyStateText: 'text-sm text-primary/70 mb-2',

  // Icon grid
  iconGrid: {
    base: 'grid py-1',
    mobile: 'px-3 gap-3',
    desktop: 'px-3 gap-2',
  },

  // Icon item wrapper
  iconItemWrapper: 'relative group flex items-center justify-center',

  // Icon button
  iconButton: {
    base: 'flex items-center justify-center rounded-lg transition-all duration-200 relative hover:bg-primary/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    selected: 'bg-primary text-primary-foreground shadow-md scale-105',
    unselected: 'text-primary hover:text-primary',
  },

  // Icon size
  iconSize: {
    mobile: 'h-6 w-6',
    desktop: 'h-5 w-5',
  },

  // Trigger button
  triggerButton:
    'w-full h-10 justify-start text-left font-normal rounded-lg border-primary/20 bg-card hover:bg-card',
  triggerIcon: 'mr-2 h-4 w-4 text-primary',
  triggerText: 'text-primary/60',

  // Desktop popover (responsive: avoid horizontal scroll on narrow viewports)
  popoverContent: 'w-[calc(100vw-40px)] max-w-[450px] p-0 bg-card flex flex-col',

  // Mobile dialog
  dialogOverlay:
    'fixed inset-0 z-50 bg-[oklch(12%_0.01_250)]/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  dialogContent:
    'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 w-[calc(100vw-40px)] max-w-[500px]',
  dialogHandle: 'mx-auto mt-3 mb-2 h-1.5 w-16 rounded-full bg-primary/20 shrink-0',
  dialogWrapper: 'flex flex-col flex-1 min-h-0',
} as const;
