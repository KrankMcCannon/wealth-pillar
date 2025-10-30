/**
 * Budget Feature Design Tokens
 * Centralized color, spacing, typography, and component tokens
 * Single source of truth for all budget-related styling
 *
 * Usage: Import and use in style utilities or directly in components
 */

/** Color Tokens */
export const budgetColors = {
  // Primary brand color
  primary: '#7578EC',
  primaryLight: '#7578EC',
  primaryDark: '#5A5BCC',

  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',

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
export const budgetSpacing = {
  page: {
    mobile: 'p-3',
    tablet: 'sm:p-4',
    desktop: 'md:p-6',
  },
  section: {
    mobile: 'px-4 py-4',
    tablet: 'sm:px-6 sm:py-6',
  },
  sectionGap: {
    mobile: 'space-y-4',
    tablet: 'sm:space-y-6',
  },
  card: {
    padding: 'p-4',
    paddingLarge: 'p-6',
  },
} as const;

/** Typography Tokens */
export const budgetTypography = {
  title: 'text-lg font-bold tracking-tight',
  subtitle: 'text-sm font-medium',
  label: 'text-xs font-semibold uppercase tracking-wide',
  body: 'text-sm',
  bodySmall: 'text-xs',
  amount: 'text-lg sm:text-xl font-bold tracking-tight',
  percentageText: 'text-xl font-bold',
} as const;

/** Component-Specific Tokens */
export const budgetComponents = {
  // Header
  header: {
    container: 'sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm',
    title: 'text-lg font-bold tracking-tight',
    button: 'text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 min-w-10 min-h-10 flex items-center justify-center',
  },

  // Card/Section
  card: {
    base: 'bg-card/90 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 shadow-lg shadow-muted/40 rounded-xl sm:rounded-2xl border border-primary/20',
    compact: 'bg-card/60 rounded-xl',
  },

  // Metrics Display
  metrics: {
    container: 'grid grid-cols-3 gap-3',
    item: 'text-center p-3 bg-card/60 rounded-lg',
    label: 'text-xs font-semibold uppercase tracking-wide mb-1',
    value: 'text-lg sm:text-xl font-bold tracking-tight',
  },

  // Progress Bar
  progress: {
    container: 'bg-card/60 rounded-xl space-y-3',
    bar: 'w-full h-3 rounded-full bg-primary/10',
    fill: 'h-3 rounded-full transition-all duration-700 ease-out',
  },

  // Button
  button: {
    primary: 'text-sm font-semibold hover:hover:bg-muted rounded-xl transition-all duration-200 px-5 py-2.5 min-h-10 border border-primary/20 hover:border-primary/40 hover:shadow-sm',
  },

  // Dropdown Menu
  dropdown: {
    content: 'w-56 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200',
    item: 'text-sm font-medium text-primary hover:bg-primary hover:text-white rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
  },

  // Select/Dropdown
  select: {
    trigger: 'w-full h-14 bg-card border border-primary/20 shadow-sm rounded-xl px-4 hover:border-[#7578EC]/40 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all text-sm font-medium',
    content: "bg-card/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl min-w-[320px]",
    item: 'hover:bg-primary/8 rounded-lg px-7 cursor-pointer font-medium group',
  },

  // Transaction Group
  transactionGroup: {
    header: 'flex items-center justify-between mb-2 px-1',
    title: 'text-lg font-bold tracking-tight',
    total: 'text-sm font-bold',
  },

  // Chart
  chart: {
    container: 'relative h-48 bg-card px-6 pb-8',
    labels: 'relative px-1 mt-2 pb-2',
    label: 'text-xs font-medium tabular-nums',
  },

  // Empty State
  emptyState: {
    container: 'text-center py-12',
    icon: 'w-16 h-16 bg-[#7578EC]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto',
    title: 'text-lg font-semibold mb-2',
    text: 'text-sm',
  },
} as const;

/** Status Variants */
export const budgetStatus = {
  safe: {
    indicator: 'bg-primary',
    text: 'text-primary',
    message: '✅ Budget sotto controllo',
    color: 'from-green-400 to-green-500',
  },
  warning: {
    indicator: 'bg-warning',
    text: 'text-warning',
    message: '⚠️ Attenzione, quasi esaurito',
    color: 'from-amber-400 to-amber-500',
  },
  danger: {
    indicator: 'bg-red-500',
    text: 'text-destructive',
    message: '⚠️ Budget superato',
    color: 'from-red-500 to-red-600',
  },
} as const;

/** Responsive Breakpoints */
export const budgetBreakpoints = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Z-Index Scale */
export const budgetZIndex = {
  dropdown: 'z-20',
  modal: 'z-40',
  tooltip: 'z-50',
} as const;

/** Animation Tokens */
export const budgetAnimations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  pulse: 'animate-pulse',
  smooth: 'transition-all duration-200',
} as const;
