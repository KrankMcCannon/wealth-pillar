export const iconPickerStyles = {
  container: 'flex h-full min-h-0 flex-col',

  header: {
    base: 'shrink-0 space-y-2 border-b border-modal-border/30 bg-modal-elevated/50 backdrop-blur-sm',
    mobile: 'p-2',
    desktop: 'p-3',
  },

  searchWrapper: 'relative',
  searchInput: 'h-10 bg-transparent pr-8',
  searchClearButton:
    'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-modal-elevated-hover',
  searchClearIcon: 'h-4 w-4 text-modal-fg-muted',

  recentContainer:
    'flex flex-1 items-center gap-1 overflow-hidden rounded-md bg-modal-ring/15 px-2 text-xs text-modal-fg-muted',
  recentIcon: 'h-3.5 w-3.5 shrink-0',
  recentLabel: 'shrink-0',
  recentIconsWrapper: 'flex gap-1 overflow-x-auto',
  recentIconButton: 'shrink-0 rounded p-0.5 transition-colors hover:bg-modal-elevated-hover',
  recentIconSize: 'h-3.5 w-3.5 text-modal-fg',

  tabsContainer:
    'overflow-x-auto border-b border-modal-border/30 bg-modal-elevated/35 backdrop-blur-sm',
  tabsList: 'inline-flex h-10 w-full justify-start rounded-none bg-transparent p-0',
  tabsTrigger:
    'relative whitespace-nowrap rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-modal-ring/55 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-modal-fg',

  resultsCount: {
    base: 'shrink-0 bg-modal-ring/12 py-1.5 text-xs text-modal-fg-muted',
    mobile: 'px-2',
    desktop: 'px-3',
  },

  gridContainer: 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden',

  emptyState: 'flex h-full flex-col items-center justify-center py-8 text-center',
  emptyStateText: 'mb-2 text-sm text-modal-fg-muted',

  iconGrid: {
    base: 'grid py-1',
    mobile: 'gap-3 px-3',
    desktop: 'gap-2 px-3',
  },

  iconItemWrapper: 'group relative flex items-center justify-center',

  iconButton: {
    base: 'relative flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 hover:bg-modal-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-modal-surface',
    selected: 'scale-105 bg-modal-ring text-modal-fg shadow-md',
    unselected: 'text-modal-fg hover:text-modal-fg',
  },

  iconSize: {
    mobile: 'h-6 w-6',
    desktop: 'h-5 w-5',
  },

  triggerButton:
    'h-10 w-full justify-start rounded-lg border border-modal-border/35 bg-modal-elevated/90 text-left font-normal text-modal-fg hover:bg-modal-elevated-hover',
  triggerIcon: 'mr-2 h-4 w-4 text-modal-ring',
  triggerText: 'text-modal-fg-muted',

  popoverContent: 'flex w-[calc(100vw-40px)] max-w-[450px] flex-col bg-modal-surface p-0',

  dialogOverlay:
    'fixed inset-0 z-50 bg-[oklch(12%_0.01_250)]/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  dialogContent:
    'modal-chrome fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-40px)] max-w-[500px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-modal-border/40 bg-modal-surface shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  dialogHandle: 'mx-auto mt-3 mb-2 h-1.5 w-16 shrink-0 rounded-full bg-modal-handle/35',
  dialogWrapper: 'flex min-h-0 flex-1 flex-col',
} as const;
