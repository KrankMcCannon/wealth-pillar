/**
 * Settings Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in settings-tokens.ts
 */

export const settingsStyles = {
  // Page layout
  page: {
    container: 'relative flex size-full min-h-[100dvh] flex-col bg-card',
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },

  // Header section
  header: {
    container:
      'sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 shadow-sm px-3 sm:px-4 py-2 sm:py-3',
    inner: 'flex items-center justify-between',
    button:
      'text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center',
    title: 'text-lg sm:text-xl font-bold tracking-tight text-black',
    spacer: 'min-w-[44px] min-h-[44px]',
  },

  // Main content
  main: {
    container: 'px-3 sm:px-4 py-4 pb-20 space-y-6',
  },

  // Section header
  sectionHeader: {
    container: 'mb-4',
    title: 'text-sm font-semibold text-[#7678e4]',
    badge: 'flex items-center gap-2 px-3 py-1.5 bg-[#7678e4]/10 rounded-full',
    badgeIcon: 'h-4 w-4 text-[#7678e4]',
    badgeText: 'text-sm font-semibold text-[#7678e4]',
  },

  // Card section
  card: {
    container:
      'gap-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden',
    divider: 'divide-y divide-[#7678e4]/8',
    item: 'flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200',
    itemText: 'text-left',
    dividerLine: 'h-px bg-[#7678e4]/10',
  },

  // Profile section
  profile: {
    header: 'flex items-center justify-between px-2 py-4 bg-card',
    container: 'flex items-center gap-4 flex-1 min-w-0',
    avatar:
      'size-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#7678e4]/30 shrink-0',
    info: 'flex-1 min-w-0',
    name: 'text-xl font-bold text-[#7678e4] mb-1 truncate',
    badges: 'flex items-center gap-2 flex-wrap',
    badge:
      'px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7678e4]/15 text-[#7678e4] whitespace-nowrap',
    editButton:
      'hover:bg-[#7678e4] hover:text-white transition-all duration-200 border-0 bg-[#7678e4]/10 text-[#7678e4] rounded-xl px-4 py-2 font-medium shadow-sm hover:shadow-lg hover:shadow-[#7678e4]/25 whitespace-nowrap',
  },

  // Profile details
  profileDetails: {
    container: 'divide-y divide-[#7678e4]/8',
    item: 'flex items-center gap-3 p-3 hover:bg-[#7678e4]/8 transition-colors duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm group-hover:scale-[1.02] transition-transform duration-200',
    icon: 'h-5 w-5',
    content: 'flex-1',
    label: 'text-sm font-semibold text-[#7678e4] block mb-0.5',
    value: 'text-sm',
  },

  // Group management section
  groupManagement: {
    title: 'text-sm font-semibold text-[#7678e4]',
    subtitle: 'text-xs mt-0.5',
    header: 'px-4 py-3 bg-card',
    list: 'divide-y divide-[#7678e4]/8',
    item: 'p-3 flex items-center justify-between hover:bg-[#7678e4]/8 transition-all duration-200',
    memberLeft: 'flex items-center gap-3 flex-1 min-w-0',
    memberAvatar: 'w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0',
    memberRight: 'text-right shrink-0 ml-3',
    memberName: 'text-sm font-semibold text-[#7678e4] truncate',
    memberEmail: 'text-xs truncate',
    memberDate: 'text-xs mt-1 truncate',
  },

  // Action button
  actionButton: {
    container: 'flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm',
    icon: 'h-5 w-5',
    content: 'flex items-center flex-1 min-w-0',
    title: 'text-sm font-semibold text-[#7678e4]',
    subtitle: 'text-xs truncate',
    chevron: 'h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0',
  },

  // Settings preference item
  preference: {
    container: 'flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm',
    icon: 'h-5 w-5',
    content: 'flex-1 min-w-0',
    label: 'text-sm font-semibold text-[#7678e4]',
    value: 'text-xs',
    button: 'text-[#7678e4] hover:bg-primary/8 transition-all duration-200 shrink-0',
  },

  // Notification item
  notification: {
    container: 'flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200',
    toggle: {
      wrapper: 'relative shrink-0',
      input: 'sr-only peer',
      label: 'flex items-center cursor-pointer',
      track: 'relative w-12 h-6 bg-primary/12 peer-checked:bg-primary rounded-full transition-colors duration-200 shadow-inner',
      thumb: 'absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md',
    },
  },

  // Security button
  security: {
    container: 'flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm',
    icon: 'h-5 w-5',
    title: 'text-sm font-semibold text-[#7678e4]',
    subtitle: 'text-xs truncate',
    chevron: 'h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0',
  },

  // Account actions (delete)
  accountActions: {
    container:
      'gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-red-500/15 border-0 rounded-2xl overflow-hidden',
    button: 'flex items-center justify-between p-3 w-full text-left hover:bg-red-50/50 transition-all duration-200 text-red-600 group',
    iconContainer:
      'flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:scale-[1.02] transition-transform duration-200 shadow-sm',
    icon: 'h-5 w-5',
    title: 'text-sm font-semibold text-red-700',
    subtitle: 'text-xs text-red-500 truncate',
    chevron: 'h-4 w-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0',
  },

  // Loading states
  skeleton: {
    base: 'animate-pulse bg-primary/12 rounded',
    text: 'h-4 bg-primary/15 rounded w-3/4',
    card: 'h-24 bg-primary/15 rounded-xl',
    line: 'h-2 bg-primary/12 rounded w-full',
  },
};

/**
 * Helper function to get card styles for error sections
 */
export function getErrorCardStyles(): string {
  return 'gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-red-500/15 border-0 rounded-2xl overflow-hidden';
}

/**
 * Helper function to get role badge color
 */
export function getRoleBadgeColor(role: string): string {
  const roleColors: Record<string, string> = {
    superadmin: 'bg-[#7678e4]/15 text-[#7678e4]',
    admin: 'bg-purple-100/50 text-purple-700',
    member: 'bg-gray-100/50 text-gray-700',
  };
  return roleColors[role] || 'bg-gray-100/50 text-gray-700';
}
