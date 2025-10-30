/**
 * Transaction Feature Design Tokens
 * Centralized color, spacing, typography, and component tokens
 * Single source of truth for all transaction-related styling
 *
 * Usage: Import and use in style utilities or directly in components
 */

/** Color Tokens */
export const transactionColors = {
  // Primary brand color
  primary: '#7578EC',
  primaryLight: '#7578EC',
  primaryDark: '#5A5BCC',

  // Status colors
  income: '#10b981',
  incomeLight: '#d1fae5',
  expense: '#ef4444',
  expenseLight: '#fee2e2',
  transfer: '#f59e0b',
  transferLight: '#fef3c7',

  // Semantic colors
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    tertiary: 'text-muted-foreground/60',
    destructive: 'text-destructive',
  },

  // Background colors
  background: {
    base: 'bg-background',
    card: 'bg-card',
    cardHover: 'bg-card/90',
    overlay: 'bg-card/95',
    muted: 'bg-muted',
    primaryLight: 'bg-primary/10',
    primaryLighter: 'bg-primary/5',
  },

  // Border colors
  border: {
    primary: 'border-primary/20',
    secondary: 'border-border/50',
    tertiary: 'border-border/60',
    light: 'border-border/30',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    cardShadow: 'shadow-lg shadow-muted/40',
  },
} as const;

/** Spacing Tokens */
export const transactionSpacing = {
  page: {
    mobile: 'p-3',
    tablet: 'sm:p-4',
    desktop: 'md:p-6',
  },
  section: {
    mobile: 'px-3',
    tablet: 'sm:px-4',
  },
  sectionGap: {
    mobile: 'space-y-4',
    tablet: 'sm:space-y-6',
  },
  card: {
    padding: 'p-3 sm:p-4',
    paddingLarge: 'p-4 sm:p-6',
  },
} as const;

/** Typography Tokens */
export const transactionTypography = {
  title: 'text-lg sm:text-xl font-bold tracking-tight',
  subtitle: 'text-sm font-medium',
  label: 'text-xs font-semibold uppercase tracking-wide',
  body: 'text-sm',
  bodySmall: 'text-xs',
  amount: 'text-lg sm:text-xl font-bold tracking-tight',
  dateLabel: 'text-xs font-medium',
} as const;

/** Component-Specific Tokens */
export const transactionComponents = {
  // Header
  header: {
    container: 'sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm',
    title: 'text-lg sm:text-xl font-bold tracking-tight',
    button: 'text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center',
  },

  // User Selector
  userSelector: {
    container: 'sticky top-[60px] z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2',
  },

  // Tab Navigation
  tabNavigation: {
    container: 'flex gap-2 border-b border-primary/20 px-3 sm:px-4 py-2',
    tab: 'px-4 py-2 text-sm font-medium rounded-t-lg',
    tabActive: 'text-primary border-b-2 border-primary',
    tabInactive: 'text-muted-foreground hover:text-foreground',
  },

  // Search Bar
  search: {
    container: 'flex-1 relative',
    icon: 'absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/60 z-10',
    input: 'rounded-2xl pl-12 pr-4 py-3 bg-card/80 backdrop-blur-sm border border-primary/20 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 h-12 shadow-sm hover:shadow-md transition-all duration-300',
  },

  // Filter Button
  filter: {
    button: 'p-2 sm:p-3 rounded-xl border border-primary/20 hover:border-primary/40 transition-all',
  },

  // Active Filters Display
  activeFilters: {
    container: 'bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-3',
    header: 'flex items-center gap-2',
    icon: 'h-4 w-4 text-primary',
    label: 'text-sm font-medium text-primary',
    badges: 'flex gap-2',
  },

  // Day Group
  dayGroup: {
    header: 'flex items-center justify-between mb-2 px-1',
    title: 'text-lg font-bold tracking-tight',
    stats: 'text-right',
    statsLabel: 'text-sm',
    statsValue: 'text-sm font-bold',
    statsValuePositive: 'text-primary',
    statsValueNegative: 'text-destructive',
    count: 'text-xs mt-0.5',
  },

  // Transaction Card
  transactionCard: {
    container: 'bg-card/90 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group',
    header: 'flex items-center gap-3 mb-1',
    icon: 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
    content: 'flex-1 min-w-0',
    title: 'text-sm font-semibold truncate',
    category: 'text-xs text-muted-foreground',
    amount: 'text-right shrink-0',
    amountValue: 'text-sm font-bold',
    deleteButton: 'opacity-0 group-hover:opacity-100 transition-opacity',
  },

  // Modal
  modal: {
    content: 'bg-card border border-primary/20 rounded-2xl shadow-xl',
  },

  // Empty State
  emptyState: {
    container: 'text-center py-12',
    icon: 'w-24 h-24 bg-[#7578EC]/10 rounded-full flex items-center justify-center mb-4 mx-auto',
    title: 'text-lg font-medium mb-2',
    text: 'text-sm text-muted-foreground',
  },
} as const;

/** Transaction Type Variants */
export const transactionTypeStyles = {
  expense: {
    icon: 'bg-red-100 text-red-600',
    badge: 'bg-red-50 text-red-700',
    text: 'text-destructive',
    color: 'from-red-500 to-red-600',
  },
  income: {
    icon: 'bg-green-100 text-green-600',
    badge: 'bg-green-50 text-green-700',
    text: 'text-primary',
    color: 'from-green-400 to-green-500',
  },
  transfer: {
    icon: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    text: 'text-warning',
    color: 'from-amber-400 to-amber-500',
  },
} as const;

/** Responsive Breakpoints */
export const transactionBreakpoints = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Z-Index Scale */
export const transactionZIndex = {
  stickyHeader: 'z-20',
  userSelector: 'z-10',
  dropdown: 'z-20',
  modal: 'z-40',
  tooltip: 'z-50',
} as const;

/** Animation Tokens */
export const transactionAnimations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  pulse: 'animate-pulse',
  smooth: 'transition-all duration-200',
} as const;
