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
    primary: 'text-black',
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
    muted: 'bg-primary/10',
    primaryLight: 'bg-primary/10',
    primaryLighter: 'bg-primary/5',
  },

  // Border colors
  border: {
    primary: 'border-primary/20',
    secondary: 'border-primary/25',
    tertiary: 'border-primary/30',
    light: 'border-primary/20',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    cardShadow: 'shadow-lg shadow-primary/20',
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
    tabInactive: 'text-muted-foreground hover:text-black',
  },

  // Day Group
  dayGroup: {
    header: 'flex items-center justify-between mb-2 px-1',
    title: 'text-lg font-bold tracking-tight',
    stats: 'text-right',
    statsLabel: 'text-sm',
    statsValue: 'text-sm font-bold',
    statsValuePositive: 'text-success',
    statsValueNegative: 'text-destructive',
    count: 'text-xs mt-0.5',
  },

  // Modal
  modal: {
    content: 'bg-card',
    title: 'text-lg sm:text-xl font-bold tracking-tight text-black',
    description: 'text-sm text-black/70',
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

/** Animation and Interaction Tokens */
export const transactionInteraction = {
  // Swipe-to-delete configuration
  swipe: {
    actionWidth: 88,          // Width of delete button reveal area (increased for better touch target)
    threshold: 44,            // Distance threshold to trigger open (50% of actionWidth)
    velocityThreshold: -120,  // Velocity threshold for quick swipes (more deliberate than -100)
  },

  // Spring animation parameters
  spring: {
    stiffness: 450,           // Increased for snappier feel (was 400)
    damping: 32,              // Slightly more damping to prevent overshoot (was 30)
  },

  // Drag constraints
  drag: {
    elastic: 0.08,            // How much overshoot is allowed (tighter than 0.1)
  },

  // Tap detection
  tap: {
    threshold: 10,            // Max drag distance to still count as tap (prevents accidental edits)
  },
} as const;

/** Grouped Transaction Card Tokens */
export const groupedCardTokens = {
  // Spacing - single source of truth
  spacing: {
    cardPadding: 'py-0',                    // Card wrapper (no vertical padding)
    rowPadding: 'px-4 py-3',                // Individual row padding (increased for better touch targets)
    rowGap: 'gap-3',                        // Gap between icon and content
    contentGap: 'gap-1.5',                  // Gap in metadata row
  },

  // Borders - eliminate double borders
  borders: {
    cardBorder: 'border border-primary/20',
    rowDivider: 'divide-y divide-border/50', // Use semantic border color
    lastRowNoBorder: 'last:border-0',
  },

  // Row states
  row: {
    base: 'relative bg-card cursor-pointer transition-colors',
    hover: 'active:bg-accent/5',
    deleteLayer: 'absolute right-0 top-0 bottom-0 flex items-center justify-end',
  },

  // Icon
  icon: {
    container: 'flex size-9 items-center justify-center rounded-xl shadow-sm transition-all duration-200 shrink-0',
    hover: 'group-hover:scale-105',
  },

  // Text elements
  text: {
    title: 'font-semibold transition-colors truncate text-[15px] text-foreground/90',
    metadata: 'text-xs text-muted-foreground font-medium',
    metadataSecondary: 'text-xs text-muted-foreground/80',
    separator: 'text-xs text-primary/30',
    amount: 'text-[15px] font-bold tracking-tight',
    amountSecondary: 'text-[10px] mt-0.5 font-medium opacity-70',
  },

  // Badge
  badge: {
    base: 'text-[10px] font-semibold px-1.5 py-0 border-primary/10',
  },

  // Delete button
  deleteButton: {
    base: 'h-full px-4 font-semibold text-white flex items-center justify-center bg-destructive',
    active: 'active:opacity-90',
  },
} as const;

/** Card Variant Styles */
export const cardVariants = {
  regular: {
    card: 'py-0 bg-card backdrop-blur-sm border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden',
    header: 'bg-primary/5 border-b border-primary/20 px-4 py-2.5',
  },
  recurrent: {
    card: 'py-0 bg-primary/5 backdrop-blur-sm border border-primary/20 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden',
    header: 'bg-primary/10 border-b border-primary/20 px-4 py-2.5',
  },
} as const;

/** Context-based Color Tokens */
export const contextColors = {
  // Due context urgency colors
  due: {
    urgent: 'bg-destructive/10 text-destructive',      // <= 1 day
    warning: 'bg-warning/10 text-warning',             // <= 3 days
    normal: 'bg-primary/10 text-primary',              // > 3 days
  },

  // Badge colors for due context
  dueBadge: {
    urgent: 'border-destructive/30 text-destructive bg-destructive/10',
    warning: 'border-warning/30 text-warning bg-warning/10',
    normal: 'border-primary/20 text-primary bg-primary/10',
  },
} as const;
