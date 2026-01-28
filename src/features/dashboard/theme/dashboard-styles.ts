/**
 * Dashboard Style Utilities
 * Organized by component section for consistency and maintainability
 */

export const dashboardStyles = {
  // Page layout
  page: {
    container: 'relative flex w-full min-h-[100svh] flex-col bg-card',
    main: 'pb-14',
  },

  // Header section
  header: {
    container: 'sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm',
    inner: 'flex items-center justify-between',
    button: 'hover:bg-primary/8 text-primary rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center group hover:scale-[1.02]',
    title: 'text-base font-semibold',
    section: {
      left: 'flex items-center gap-3',
      right: 'flex items-center gap-1',
      profile: 'flex items-center gap-3',
      profileName: 'flex flex-col',
      profileIcon: 'rounded-xl',
      notificationIcon: 'h-4 w-4 group-hover:animate-pulse',
      settingsIcon: 'h-4 w-4 group-hover:rotate-90 transition-transform duration-300',
    },
  },

  // User selector
  userSelector: {
    container: 'px-4 py-3 border-b border-border/50',
    inner: 'flex gap-2 overflow-x-auto pb-2',
    item: {
      base: 'flex-shrink-0 px-3 py-1.5 rounded-full border transition-all duration-200',
      active: 'bg-primary text-primary-foreground border-primary',
      inactive: 'border-border/50 hover:border-primary/50 hover:bg-primary/5',
      text: 'text-sm font-medium whitespace-nowrap',
    },
  },

  // Balance section
  balanceSection: {
    container: 'p-4 bg-card/50 backdrop-blur-sm border-b border-primary/10',
    header: 'mb-4',
    title: 'text-sm font-medium text-muted mb-3',
    grid: 'grid gap-3',
    totalBalance: {
      container: 'bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 backdrop-blur-sm',
      label: 'text-xs text-muted mb-1',
      value: 'text-2xl font-bold text-primary',
      currency: 'text-lg',
    },
    accountCard: {
      container: 'bg-card border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-colors',
      header: 'flex items-center justify-between mb-2',
      name: 'font-medium text-sm',
      balance: 'text-base font-semibold text-primary',
      expandIcon: 'h-4 w-4 transition-transform duration-200',
    },
    accountDetails: {
      container: 'mt-3 pt-3 border-t border-border/50 space-y-2',
      row: 'flex justify-between text-xs',
      label: 'text-muted',
      value: 'font-medium',
    },
  },

  // Divider
  divider: 'h-px bg-primary/15 mx-4',

  // Budget section
  budgetSection: {
    container: 'bg-card/30 backdrop-blur-md p-4 border-y border-primary/10',
    header: 'mb-4',
    title: 'text-sm font-medium text-muted mb-3',
    grid: 'grid gap-4',
    emptyState: 'text-center py-4 text-muted',
    budgetCard: {
      container: 'bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors backdrop-blur-sm',
      header: 'flex items-center gap-3 mb-3',
      icon: 'w-8 h-8 text-primary',
      titleSection: 'flex-1',
      name: 'font-semibold text-sm',
      description: 'text-xs text-muted',
      actions: 'flex gap-1',
      actionButton: 'h-6 w-6 p-0 hover:bg-primary/10 rounded',
    },
    progress: {
      container: 'mb-3',
      label: 'flex justify-between items-center mb-1.5 text-xs',
      labelText: 'font-medium',
      labelValue: 'text-primary font-semibold',
      bar: 'h-2 bg-primary/12 rounded-full overflow-hidden',
      fill: 'h-full bg-primary transition-all duration-300',
    },
    stats: {
      container: 'grid grid-cols-2 gap-2',
      stat: 'bg-primary/5 rounded-lg p-2',
      label: 'text-xs text-muted mb-0.5',
      value: 'text-sm font-semibold text-primary',
    },
  },

  // Recurring series section
  recurringSection: {
    container: 'bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/10 rounded-xl border border-primary/20 m-4',
    header: 'mb-4',
    title: 'text-sm font-medium text-muted mb-3',
    grid: 'grid gap-3',
    emptyState: 'text-center py-6 text-muted text-sm',
    seriesCard: {
      container: 'bg-card rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors backdrop-blur-sm',
      header: 'flex items-center justify-between mb-2',
      title: 'font-medium text-sm',
      frequency: 'text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded',
      details: 'text-xs text-muted space-y-1',
      amount: 'font-semibold text-primary',
    },
  },

  // Form modal
  modal: {
    overlay: 'fixed inset-0 bg-black/50 z-40',
    content: 'bg-card rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto',
    header: 'flex items-center justify-between p-4 border-b border-border/50',
    title: 'font-semibold text-lg',
    closeButton: 'h-6 w-6 p-0 hover:bg-primary/10 rounded',
    body: 'p-4',
    footer: 'flex gap-2 p-4 border-t border-border/50',
  },

  // Loading states
  skeleton: {
    base: 'animate-pulse bg-primary/12 rounded',
    text: 'h-4 bg-primary/15 rounded w-3/4',
    card: 'h-24 bg-primary/15 rounded-xl',
    line: 'h-2 bg-primary/12 rounded w-full',
  },
  skeletons: {
    shimmer: 'liquid-shimmer bg-primary/12',
    headerIcon: 'w-8 h-8 rounded-xl',
    headerTextGroup: 'flex flex-col gap-1',
    headerLinePrimary: 'h-4 w-24 rounded',
    headerLineSecondary: 'h-3 w-20 rounded',
    userPill: 'shrink-0 h-8 w-20 rounded-full',
    accountRow: 'flex justify-between gap-2',
    accountLinePrimary: 'h-4 w-24 rounded flex-1',
    accountLineSecondary: 'h-4 w-20 rounded',
    budgetRow: 'flex gap-3 mb-3',
    budgetIcon: 'w-8 h-8 rounded',
    budgetText: 'flex-1 space-y-1',
    budgetLinePrimary: 'h-4 w-24 rounded',
    budgetLineSecondary: 'h-3 w-20 rounded',
    budgetProgress: 'h-2 rounded-full mb-3',
    budgetStats: 'grid grid-cols-2 gap-2',
    budgetStat: 'h-8 rounded',
    recurringRow: 'flex justify-between mb-2 gap-2',
    recurringLinePrimary: 'h-4 w-24 rounded flex-1',
    recurringLineSecondary: 'h-6 w-16 rounded',
    recurringLineTertiary: 'h-3 w-32 rounded',
  },
  loading: {
    content: 'space-y-6 p-4',
  },
  groupLoading: {
    container: 'flex items-center justify-center min-h-screen',
    card: 'space-y-4 max-w-md w-full px-4',
  },

  // Error state
  errorState: {
    container: 'p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-center',
    title: 'font-semibold text-sm text-destructive mb-1',
    message: 'text-xs text-destructive/80',
  },

  // Success feedback
  success: {
    container: 'p-3 bg-success-light border border-success/30 rounded-lg',
    text: 'text-sm text-success-dark font-medium',
  },
};

/**
 * Helper function to get dynamic styles based on state
 */
export function getAccountCardStyles(isExpanded: boolean): string {
  const base = dashboardStyles.balanceSection.accountCard.container;
  const expandedClass = isExpanded ? 'border-primary/50 bg-primary/5' : '';
  return `${base} ${expandedClass}`;
}

/**
 * Helper function to get balance color based on value
 */
export function getBalanceTextStyle(balance: number): string {
  if (balance >= 0) return 'text-primary'; // Green for positive
  return 'text-destructive'; // Red for negative
}

/**
 * Helper function to get budget status styles
 */
export function getBudgetStatusStyle(percentage: number): {
  barClass: string;
  statusClass: string;
  statusText: string;
} {
  if (percentage <= 75) {
    return {
      barClass: 'bg-success',
      statusClass: 'text-success',
      statusText: 'In Budget',
    };
  } else if (percentage <= 90) {
    return {
      barClass: 'bg-warning',
      statusClass: 'text-warning',
      statusText: 'Attenzione',
    };
  } else {
    return {
      barClass: 'bg-destructive',
      statusClass: 'text-destructive',
      statusText: 'Sforato',
    };
  }
}
