/**
 * Auth Design Tokens
 * Centralized design system for authentication pages
 * Provides consistent spacing, colors, typography, and animations
 */

export const authTokens = {
  // Colors
  colors: {
    primary: 'hsl(var(--color-primary))',
    primaryLight: 'hsl(var(--color-primary))/60',
    secondary: 'hsl(var(--color-secondary))',
    text: {
      primary: '#000000',
      secondary: '#666666',
      muted: '#999999',
    },
    background: {
      input: '#ffffff',
      card: 'bg-card',
    },
    border: {
      light: 'hsl(var(--color-primary))/20',
      focus: 'hsl(var(--color-primary))',
    },
    error: {
      bg: '#fee2e2',
      border: '#fecaca',
      text: '#991b1b',
    },
    success: {
      bg: '#dcfce7',
      text: '#166534',
    },
  },

  // Spacing
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
  },

  // Typography
  typography: {
    cardTitle: 'text-2xl font-bold',
    cardSubtitle: 'text-sm text-muted-foreground',
    label: 'text-xs font-medium text-gray-900',
    button: 'text-sm font-medium',
    helper: 'text-xs text-gray-500',
    error: 'text-xs text-red-700',
  },

  // Border Radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Animations
  animation: {
    duration: '200ms',
    timing: 'duration-200',
    transition: 'transition-all duration-200',
    spring: 'transition-all duration-300',
  },

  // Input styles
  input: {
    base: 'h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20',
    icon: 'h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60',
  },

  // Button styles
  button: {
    primary: 'w-full h-9 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/90 text-white transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium',
  },

  // Component-specific tokens
  components: {
    card: {
      padding: 'p-8',
      spacing: 'space-y-4',
    },
    form: {
      group: 'space-y-2',
      field: 'space-y-1',
    },
    divider: 'flex items-center gap-3 py-1',
  },
};
