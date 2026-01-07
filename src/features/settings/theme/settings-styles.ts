/**
 * Settings Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in settings-tokens.ts
 * Updated with modern mobile-first design principles
 */

export const settingsStyles = {
  // Page layout
  page: {
    container: 'relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50',
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },

  // Header section
  header: {
    container:
      'sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm px-3 sm:px-4 py-2 sm:py-3',
    inner: 'flex items-center justify-between',
    button:
      'text-primary hover:bg-primary hover:text-white active:scale-95 rounded-2xl transition-all duration-200 ease-out p-2 sm:p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm hover:shadow-md',
    title: 'text-lg sm:text-xl font-bold tracking-tight text-primary',
    spacer: 'min-w-[44px] min-h-[44px]',
  },

  // Main content
  main: {
    container: 'px-3 sm:px-4 py-3 pb-20 space-y-5',
  },

  // Section header
  sectionHeader: {
    container: 'mb-3',
    title: 'text-xs font-bold text-primary uppercase tracking-wide',
    badge: 'flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 rounded-full border border-primary/20',
    badgeIcon: 'h-4 w-4 text-primary',
    badgeText: 'text-sm font-semibold text-primary',
  },

  // Card section
  card: {
    container:
      'gap-0 bg-white backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-200/40 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300',
    divider: 'divide-y divide-gray-100',
    item: 'flex items-center justify-between p-3 hover:bg-gray-50/50 active:bg-gray-100/50 transition-all duration-200',
    itemText: 'text-left',
    dividerLine: 'h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent',
  },

  // Profile section
  profile: {
    header: 'flex items-center justify-between gap-3 px-3 py-3 bg-gradient-to-br from-primary/5 to-transparent',
    container: 'flex items-center gap-3 flex-1 min-w-0',
    avatar:
      'size-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/30 shrink-0',
    info: 'flex-1 min-w-0',
    name: 'text-lg font-bold text-primary mb-1.5 truncate',
    badges: 'flex items-center gap-1.5 flex-wrap',
    badge:
      'px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary whitespace-nowrap border border-primary/20',
    editButton:
      'hover:bg-primary hover:text-white active:scale-95 transition-all duration-200 border border-primary/20 bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm hover:shadow-md whitespace-nowrap shrink-0',
  },

  // Profile details
  profileDetails: {
    container: 'divide-y divide-gray-100',
    item: 'flex items-center gap-3 p-2.5 hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200',
    icon: 'h-4 w-4',
    content: 'flex-1 min-w-0',
    label: 'text-[10px] font-semibold text-primary/70 uppercase tracking-wide block mb-0.5',
    value: 'text-sm font-medium text-primary',
  },

  // Group management section
  groupManagement: {
    title: 'text-sm font-bold text-primary',
    subtitle: 'text-xs text-primary/70 mt-0.5',
    header: 'px-3 py-2.5 bg-gradient-to-br from-primary/5 to-transparent',
    list: 'divide-y divide-gray-100',
    item: 'p-3 flex items-center justify-between hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200',
    memberLeft: 'flex items-center gap-2.5 flex-1 min-w-0',
    memberAvatar: 'w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-semibold shadow-md shrink-0',
    memberRight: 'text-right shrink-0 ml-3',
    memberName: 'text-sm font-semibold text-primary truncate',
    memberEmail: 'text-xs text-primary/70 truncate mt-0.5',
    memberDate: 'text-xs text-primary/50 mt-0.5 truncate',
  },

  // Action button
  actionButton: {
    container: 'flex items-center justify-between p-3 w-full text-left hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-105 group-active:scale-95 transition-all duration-200 shadow-sm',
    icon: 'h-4 w-4',
    content: 'flex items-center flex-1 min-w-0',
    title: 'text-sm font-semibold text-primary',
    subtitle: 'text-xs text-primary/70 truncate mt-0.5',
    chevron: 'h-4 w-4 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0',
  },

  // Settings preference item
  preference: {
    container: 'flex items-center justify-between p-3 hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-105 group-active:scale-95 transition-all duration-200 shadow-sm',
    icon: 'h-4 w-4',
    content: 'flex-1 min-w-0',
    label: 'text-sm font-semibold text-primary',
    value: 'text-xs text-primary/70 mt-0.5',
    button: 'text-primary hover:bg-primary/10 active:scale-95 transition-all duration-200 shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium',
  },

  // Notification item
  notification: {
    container: 'flex items-center justify-between p-3 hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200',
    toggle: {
      wrapper: 'relative flex items-center cursor-pointer select-none shrink-0',
      input: 'sr-only peer',
      track: 'w-12 h-7 bg-gray-200 peer-checked:bg-primary rounded-full transition-all duration-300 shadow-inner peer-focus:ring-4 peer-focus:ring-primary/20',
      thumb: 'absolute left-0.5 top-0.5 bg-white w-6 h-6 rounded-full transition-all duration-300 ease-out peer-checked:translate-x-5 shadow-lg peer-checked:shadow-primary/50 pointer-events-none',
    },
  },

  // Security button
  security: {
    container: 'flex items-center justify-between p-3 w-full text-left hover:bg-gray-50/70 active:bg-gray-100/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-105 group-active:scale-95 transition-all duration-200 shadow-sm',
    icon: 'h-4 w-4',
    title: 'text-sm font-semibold text-primary',
    subtitle: 'text-xs text-primary/70 truncate mt-0.5',
    chevron: 'h-4 w-4 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0',
  },

  // Account actions (delete)
  accountActions: {
    container:
      'gap-0 p-0 bg-white backdrop-blur-sm shadow-lg shadow-red-200/50 border border-red-200/40 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-red-200/60 transition-all duration-300',
    button: 'flex items-center justify-between p-3 w-full text-left hover:bg-red-50/70 active:bg-red-100/50 transition-all duration-200 text-red-600 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 group-hover:scale-105 group-active:scale-95 transition-all duration-200 shadow-sm',
    icon: 'h-4 w-4',
    title: 'text-sm font-semibold text-red-700',
    subtitle: 'text-xs text-red-500 truncate mt-0.5',
    chevron: 'h-4 w-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200 shrink-0',
  },

  // Loading states
  skeleton: {
    base: 'animate-pulse bg-gray-200 rounded-2xl',
    text: 'h-4 bg-gray-200 rounded-lg w-3/4',
    card: 'h-28 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl shadow-sm',
    line: 'h-2 bg-gray-200 rounded-full w-full',
  },
};

/**
 * Helper function to get card styles for error sections
 */
export function getErrorCardStyles(): string {
  return 'gap-0 p-0 bg-white backdrop-blur-sm shadow-lg shadow-red-200/50 border border-red-200/40 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-red-200/60 transition-all duration-300';
}

/**
 * Helper function to get role badge color
 */
export function getRoleBadgeColor(role: string): string {
  const roleColors: Record<string, string> = {
    superadmin: 'bg-gradient-to-br from-primary to-primary/80 text-white border border-primary/20 shadow-md',
    admin: 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 border border-purple-200',
    member: 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 border border-gray-200',
  };
  return roleColors[role] || 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
}
