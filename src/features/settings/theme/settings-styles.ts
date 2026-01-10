/**
 * Settings Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in settings-tokens.ts
 * Updated with modern mobile-first design principles
 */

export const settingsStyles = {
  // Page layout
  page: {
    container: 'relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-primary/5 via-white to-primary/5',
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
    spacing: 'mb-4',
    iconPrimary: 'text-primary',
    iconDestructive: 'text-red-600',
  },

  // Card section
  card: {
    container:
      'gap-0 bg-white backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-200/40 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300',
    divider: 'divide-y divide-gray-100',
    item: 'flex items-center justify-between p-3 hover:bg-gray-50/50 active:bg-gray-100/50 transition-all duration-200',
    itemText: 'text-left',
    dividerLine: 'h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent',
    containerTight:
      'gap-0 bg-white backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-200/40 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 pb-0 mb-4',
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
    valueCapitalize: 'text-sm font-medium text-primary capitalize',
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
  skeletons: {
    shimmer: 'animate-pulse bg-primary/12',
    headerIcon: 'w-10 h-10 rounded-xl',
    headerTitle: 'w-24 h-6 rounded-lg',
    section: 'space-y-4',
    sectionTitle: 'h-6 rounded-lg bg-primary/15 animate-pulse',
    card: 'bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden',
    cardHeader: 'flex items-center gap-4 px-2 py-4 bg-card',
    avatar: 'size-16 rounded-2xl bg-primary/12 shrink-0 animate-pulse',
    headerBody: 'flex-1 space-y-2',
    headerLinePrimary: 'h-6 w-24 bg-primary/15 rounded-lg animate-pulse',
    headerLineSecondary: 'h-4 w-32 bg-primary/15 rounded-lg animate-pulse',
    dividerLight: 'divide-y divide-[#7678e4]/8',
    dividerStrong: 'divide-y divide-[#7678e4]/10',
    listRow: 'flex items-center gap-3 p-3',
    listRowSpace: 'flex items-center justify-between p-3',
    listIcon: 'size-10 bg-primary/12 rounded-xl shrink-0 animate-pulse',
    listBody: 'flex-1 space-y-1',
    listLineShort: 'h-3 w-16 bg-primary/15 rounded animate-pulse',
    listLineMedium: 'h-3 w-24 bg-primary/15 rounded animate-pulse',
    listLineLong: 'h-3 w-32 bg-primary/15 rounded animate-pulse',
    listLineXL: 'h-4 w-32 bg-primary/15 rounded animate-pulse',
    listLineXLLong: 'h-3 w-40 bg-primary/15 rounded animate-pulse',
    memberRow: 'p-3 flex items-center justify-between',
    memberLeft: 'flex items-center gap-3 flex-1',
    memberIcon: 'w-10 h-10 bg-primary/12 rounded-xl shrink-0 animate-pulse',
    memberBody: 'flex-1 space-y-1',
    switchPill: 'w-16 h-8 bg-primary/12 rounded-full shrink-0 animate-pulse',
    cardHeaderCompact: 'px-4 py-3 bg-card space-y-2',
    headerLineSmall: 'h-4 w-32 bg-primary/15 rounded animate-pulse',
    headerLineTiny: 'h-3 w-24 bg-primary/15 rounded animate-pulse',
    cardStack: 'space-y-4',
    cardMargin: 'mb-4',
  },
  modals: {
    actionsButton: 'w-full sm:w-auto',
    loadingIcon: 'mr-2 h-4 w-4 animate-spin',
    iconSmall: 'mr-2 h-4 w-4',
    form: 'space-y-4',
    field: {
      label: 'block text-sm font-medium text-primary mb-1.5',
      input:
        'w-full px-3 py-2 text-sm rounded-lg border border-primary/20 bg-card text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
      inputError: 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
      errorText: 'mt-1.5 text-sm text-red-600',
    },
    title: 'text-lg font-semibold text-primary',
    description: 'text-sm text-primary/70',
    invite: {
      infoBox: 'rounded-lg bg-blue-50 border border-blue-200 p-3',
      infoText: 'text-sm text-blue-800',
      infoStrong: 'font-semibold',
    },
    preference: {
      list: 'space-y-2',
      itemBase:
        'w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-start gap-3 hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed',
      itemActive: 'border-primary bg-primary/10',
      itemIdle: 'border-primary/20 bg-card',
      radioBase:
        'mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
      radioActive: 'border-primary bg-primary',
      radioIdle: 'border-primary/20 bg-card',
      radioIcon: 'h-3 w-3 text-white',
      content: 'flex-1 min-w-0',
      titleRow: 'flex items-center gap-2',
      title: 'text-sm font-semibold',
      titleActive: 'text-primary',
      titleIdle: 'text-primary',
      currentBadge:
        'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium',
      description: 'text-sm text-primary/70 mt-0.5',
    },
    subscription: {
      container: 'space-y-4',
      cardBase: 'rounded-lg border-2 p-4 transition-all',
      cardActive: 'border-primary bg-primary/5',
      cardIdle: 'border-primary/20 bg-card',
      headerRow: 'flex items-start justify-between mb-3',
      planTitle: 'text-lg font-bold text-primary',
      planPrice: 'text-2xl font-bold text-primary mt-1',
      planPriceSuffix: 'text-sm font-normal text-primary/60',
      planBadge:
        'px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold',
      list: 'space-y-2',
      listItem: 'flex items-start gap-2',
      listIcon: 'h-4 w-4 text-green-600 mt-0.5 shrink-0',
      listText: 'text-sm text-primary/70',
      premiumBadgeWrap: 'absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12',
      premiumBadge:
        'absolute transform rotate-45 bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs font-bold py-1 w-32 text-center shadow-md',
      premiumBadgeStyle: { top: '35px' },
      premiumTitleRow: 'text-lg font-bold text-primary flex items-center gap-2',
      premiumIcon: 'h-5 w-5 text-yellow-500',
      secureRow: 'mt-4 pt-4 border-t border-primary/20',
      secureText: 'text-xs text-primary/60 text-center',
      secureIcon: 'inline h-3 w-3 mr-1',
      cancelButton:
        'text-red-600 hover:text-red-700 hover:bg-red-50',
    },
    deleteAccount: {
      overlay:
        'fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-6 sm:py-8',
      card: 'w-full max-w-md rounded-2xl sm:rounded-3xl bg-card shadow-2xl p-6 sm:p-8 my-auto',
      header: 'mb-6 flex items-start justify-between',
      headerLeft: 'flex items-start gap-3 flex-1',
      headerContent: 'flex-1',
      headerIconWrap:
        'h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0',
      headerIcon: 'h-6 w-6',
      title: 'text-xl sm:text-2xl font-semibold text-red-600',
      subtitle: 'text-sm text-primary/70 mt-1',
      closeButton:
        'text-primary/80 hover:text-primary p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50',
      closeIcon: 'h-5 w-5',
      body: 'space-y-4 mb-6',
      bodyText: 'text-sm text-primary',
      warningBox: 'rounded-xl border-2 border-red-200 bg-red-50 p-4',
      warningTitle: 'text-sm font-semibold text-red-900 mb-2',
      warningList: 'space-y-2 text-sm text-red-700',
      warningItem: 'flex items-start gap-2',
      warningDot: 'text-red-500 mt-0.5',
      warningAlert:
        'rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-start gap-2',
      warningAlertIcon: 'h-4 w-4 shrink-0 mt-0.5',
      footer: 'flex flex-col-reverse sm:flex-row gap-3',
      button: 'w-full sm:w-auto',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    editProfile: {},
  },
  layout: {
    row: 'flex items-center gap-3 flex-1 min-w-0',
    column: 'flex-1 min-w-0',
    rowOffset: 'flex-1 min-w-0 ml-3',
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
  accessibility: {
    srOnly: 'sr-only',
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
    card: 'h-28 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl shadow-sm',
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
    member: 'bg-gradient-to-br from-primary/10 to-primary/5 text-gray-700 border border-gray-200',
  };
  return roleColors[role] || 'bg-gradient-to-br from-primary/10 to-primary/5 text-gray-700 border border-gray-200';
}
