/** Colocated Tailwind class strings for shadcn UI primitives (formerly in system.ts). */

export const cardStyles = {
  container: `bg-card text-card-foreground flex flex-col rounded-xl border border-border shadow-sm`,
  header:
    '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4',
  title: 'leading-none font-semibold text-foreground',
  description: 'text-muted-foreground text-sm',
  content: 'px-6',
  footer: 'flex items-center px-6 [.border-t]:pt-3',
  action: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
} as const;

export const tabStyles = {
  list: 'inline-flex h-12 items-center justify-center rounded-2xl bg-muted p-1',
  trigger:
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  content: 'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
} as const;

export const badgeStyles = {
  base: 'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow,background-color] [&>svg]:size-3 [&>svg]:pointer-events-none',
  variants: {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive:
      'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'text-foreground border-border hover:bg-accent',
  },
} as const;

export const drawerStyles = {
  content:
    'fixed bottom-0 left-0 right-0 z-150 flex max-h-[96dvh] flex-col gap-0 overflow-hidden rounded-t-3xl border-t border-border/22 bg-card pb-[env(safe-area-inset-bottom)] shadow-xl',
  header: 'flex flex-col gap-2 border-b border-border/22 px-4 py-3 text-left',
  footer: 'mt-auto flex flex-col gap-3 p-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
} as const;

export const selectStyles = {
  trigger:
    'flex h-10 w-full items-center justify-between rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
  icon: 'h-4 w-4 text-muted-foreground',
  content:
    'relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  viewportBase: 'p-1',
  item: 'relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm text-foreground outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  itemIndicator: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
  separator: '-mx-1 my-1 h-px bg-border',
  label: 'py-1.5 pl-8 pr-2 text-sm font-semibold text-foreground',
} as const;

export const dropdownStyles = {
  content:
    'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  item: 'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  subTrigger:
    'flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:bg-accent data-[state=open]:bg-accent',
  subContent:
    'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  checkboxItem:
    'relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-foreground outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  radioItem:
    'relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-foreground outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  label: 'px-3 py-1.5 text-sm font-semibold text-foreground',
  separator: '-mx-1 my-1 h-px bg-border',
  shortcut: 'ml-auto text-xs tracking-widest opacity-70',
  indicator: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
} as const;
