import type { CSSProperties } from 'react';

export const formStyles = {
  layout: {
    form: 'space-y-4',
  },
  section: {
    container: 'space-y-4',
    header: 'space-y-1',
    body: 'space-y-4',
    separator: 'my-6',
  },
  field: {
    container: 'space-y-2',
    label: 'text-sm font-medium text-foreground',
    labelError: 'text-destructive',
    required: 'ml-1 text-destructive',
    inputWrap: 'relative',
    error: 'text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200',
    helper: 'text-sm text-muted-foreground',
  },
  actions: {
    container: 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
    buttonBase: 'min-h-11 w-full sm:w-auto',
    cancel: 'bg-card text-foreground border-border hover:bg-primary hover:text-primary-foreground',
    loadingIcon: 'mr-2 h-4 w-4 animate-spin',
  },
  currencyInput: {
    wrapper: 'relative',
    iconWrap: 'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
    icon: 'h-4 w-4 text-muted-foreground',
    inputBase:
      'bg-input border-border focus:ring-2 focus:ring-ring/30 text-foreground text-right font-mono',
    inputWithIcon: 'pl-10',
  },
  select: {
    trigger: 'bg-input border-border focus:ring-2 focus:ring-ring/30',
    content: 'max-h-[300px] p-0',
    searchWrap: 'sticky top-0 border-b border-border bg-popover p-2 z-10',
    searchFieldWrap: 'relative',
    searchIcon:
      'absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
    searchInput:
      'w-full pl-8 pr-3 py-2 text-sm rounded border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-border',
    optionsWrap: 'px-2 py-1',
    empty: 'py-6 text-center text-sm text-muted-foreground',
    optionRow: 'flex items-center gap-2',
  },
  categorySelect: {
    triggerRow: 'flex items-center gap-2 flex-1 min-w-0',
    triggerIcon: 'shrink-0',
    triggerLabel: 'truncate text-sm',
    triggerPlaceholder: 'text-muted-foreground',
    content:
      'relative z-10000 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-lg',
    contentAnim:
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    searchWrap: 'border-b border-border p-3 bg-card',
    searchFieldWrap: 'relative',
    searchIcon:
      'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
    searchInput:
      'w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30',
    viewport: 'max-h-[300px] overflow-y-auto p-3',
    recentWrap: 'mb-4',
    recentHeader: 'flex items-center gap-2 mb-2 px-1',
    recentIcon: 'h-3.5 w-3.5 text-muted-foreground',
    recentLabel: 'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
    recentList: 'space-y-1',
    recentItem: 'cursor-pointer outline-none focus:outline-none',
    divider: 'h-px bg-border my-3',
    allHeader: 'flex items-center gap-2 mb-2 px-1',
    allIcon: 'h-3.5 w-3.5 text-muted-foreground',
    allLabel: 'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
    empty: 'py-8 text-center text-sm text-muted-foreground',
    list: 'space-y-1',
    item: 'cursor-pointer outline-none focus:outline-none rounded-lg hover:bg-primary/5',
    itemRow: 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
    itemSelected: 'bg-primary/10',
    itemIcon: 'shrink-0',
    itemLabel: 'truncate text-sm font-medium',
  },
  multiUser: {
    container: 'space-y-2 border border-border rounded-lg p-3',
    row: 'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-card/50',
    rowActive: 'bg-primary/5',
    userRow: 'flex items-center gap-2 flex-1',
    avatar:
      'flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground',
    name: 'text-sm font-medium',
    current: 'text-xs text-muted-foreground',
  },
} as const;

export function getCategorySelectItemStyle(color: string): CSSProperties {
  return { color };
}

export function getCategorySelectWidthStyle(width: number): CSSProperties {
  return { width: `${width}px` };
}

export function getMultiUserAvatarStyle(color: string | undefined): CSSProperties {
  if (color) return { backgroundColor: color };
  return {};
}
