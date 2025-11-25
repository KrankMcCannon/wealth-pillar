/**
 * Account Feature Design Tokens
 * Centralized color, spacing, typography, and component tokens
 * Single source of truth for all account-related styling
 */

/** Color Tokens */
export const accountColors = {
  primary: '#7578EC',
  primaryLight: '#7578EC',
  primaryDark: '#5A5BCC',
  success: '#10b981',
  destructive: '#ef4444',
};

/** Spacing Tokens */
export const accountSpacing = {
  page: {
    mobile: 'px-3 sm:px-4',
    tablet: 'sm:px-6',
  },
};

/** Component Tokens */
export const accountComponents = {
  header: {
    container: 'sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-border',
    inner: 'flex items-center justify-between px-4 py-4',
    title: 'text-xl font-bold text-black',
    subtitle: 'text-xs text-muted-foreground',
    backButton: 'flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
    addButton: 'flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
  },

  balanceCard: {
    container: 'bg-card rounded-2xl p-6 border border-primary/20 shadow-xl',
    header: 'flex items-center justify-between mb-4',
    icon: 'flex items-center justify-center w-14 h-14 rounded-full bg-primary/10',
    label: 'text-sm text-muted-foreground mb-1',
    value: 'text-3xl font-bold',
    statsGrid: 'grid grid-cols-3 gap-3 mt-6',
    statItem: 'rounded-lg p-3 border',
    statItemPrimary: 'bg-primary/5 border-primary/10',
    statItemSuccess: 'bg-success/5 border-success/10',
    statItemDestructive: 'bg-destructive/5 border-destructive/10',
  },

  accountsList: {
    container: 'space-y-3',
    header: 'text-lg font-semibold text-black mb-4',
    addPrompt: 'flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group',
  },

  slider: {
    container: 'overflow-x-auto scrollbar-hide mb-4',
    inner: 'flex gap-3 pb-2',
    cardWrapper: 'transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:shadow-muted/30',
    addPlaceholder: 'flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group',
    addPromptIcon: 'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
    addPromptLabel: 'text-xs text-primary/70 group-hover:text-primary font-medium transition-colors',
  },

  totalBalanceLink: {
    container: 'flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all duration-300 group',
    leftSection: 'flex items-center gap-3',
    icon: 'flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10',
    label: 'text-xs mb-1 font-medium text-muted-foreground',
    valuePositive: 'text-xl font-bold text-success transition-colors duration-300',
    valueNegative: 'text-xl font-bold text-destructive transition-colors duration-300',
    rightSection: 'flex items-center gap-2',
    badge: 'flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20',
    badgeText: 'text-xs font-bold text-primary',
    arrow: 'h-5 w-5 text-primary group-hover:translate-x-1 transition-transform duration-300',
  },
};

/** Status-specific styles */
export const accountStatus = {
  positive: 'text-success',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
};
