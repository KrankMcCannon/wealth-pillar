export const desktopSidebarStyles = {
  container:
    'hidden md:flex fixed inset-y-0 left-0 z-[95] w-64 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl',
  brandSection: 'border-b border-sidebar-border px-6 py-5',
  brandEyebrow: 'text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/55',
  brandTitle: 'mt-1 text-lg font-bold text-sidebar-foreground',
  nav: 'flex-1 overflow-y-auto px-3 py-4 space-y-1',
  navItem:
    'h-11 w-full justify-start gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150',
  navItemActive: 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
  navItemInactive:
    'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
  navItemIcon: 'h-4 w-4 shrink-0',
  footer: 'border-t border-sidebar-border p-3',
} as const;
