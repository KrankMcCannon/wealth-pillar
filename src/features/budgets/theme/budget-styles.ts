export const typographyStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  heading: 'text-lg sm:text-xl font-bold tracking-tight',
  subheading: 'text-base font-semibold',
  body: 'text-sm',
  bodySmall: 'text-xs',
  label: 'text-xs font-medium',
  caption: 'text-xs text-primary/60',
  amount: 'text-lg sm:text-xl font-bold tracking-tight',
  amountLarge: 'text-2xl sm:text-3xl font-bold tracking-tight',
} as const;

export const spacingStyles = {
  page: {
    mobile: 'p-3',
    tablet: 'sm:p-4',
    desktop: 'md:p-6',
  },
  section: {
    mobile: 'px-3 py-4',
    tablet: 'sm:px-4 sm:py-6',
    desktop: 'md:px-6 md:py-8',
  },
  card: {
    compact: 'p-3',
    default: 'p-4',
    comfortable: 'p-6',
    large: 'p-8',
  },
} as const;

export const radiusStyles = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
  raw: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
} as const;

export const shadowStyles = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  card: 'shadow-sm',
  elevated: 'shadow-lg',
  modal: 'shadow-xl',
} as const;

export const zIndexStyles = {
  classes: {
    raised: 'z-10',
    dropdown: 'z-20',
    sticky: 'z-30',
    bottomNav: 'z-[48]',
    modal: 'z-[150]',
    popover: 'z-[160]',
    tooltip: 'z-[170]',
  },
} as const;

export const animationStyles = {
  classes: {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    transition: 'transition-all duration-200',
    transitionFast: 'transition-all duration-150',
    transitionSlow: 'transition-all duration-300',
  },
} as const;

/** Styles still used by home `BudgetSection`. */
export const budgetStyles = {
  progress: {
    barFillBase: 'h-full rounded-full transition-all duration-500',
  },
  section: {
    progressBadgeDot: 'w-1.5 h-1.5 rounded-full',
  },
} as const;

export function getBudgetCategoryColorStyle(color?: string) {
  return { backgroundColor: color || 'var(--color-muted)' };
}

export function getBudgetSectionProgressStyles(percentage: number): {
  amount: string;
  dot: string;
  text: string;
  bar: string;
} {
  if (percentage > 100) {
    return {
      amount: 'text-expense',
      dot: 'bg-expense',
      text: 'text-expense',
      bar: 'bg-expense',
    };
  }
  if (percentage > 75) {
    return {
      amount: 'text-warning',
      dot: 'bg-warning',
      text: 'text-warning',
      bar: 'bg-warning',
    };
  }
  return {
    amount: 'text-primary',
    dot: 'bg-primary',
    text: 'text-primary',
    bar: 'bg-primary',
  };
}

export function getBudgetSectionProgressBarStyle(percentage: number) {
  return { width: `${Math.min(percentage, 100)}%` };
}
