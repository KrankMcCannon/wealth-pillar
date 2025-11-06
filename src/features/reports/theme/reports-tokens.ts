/**
 * Reports Design Tokens
 * Centralized design system for reports feature
 * Provides consistent spacing, colors, typography, and animations
 */

export const reportsTokens = {
  // Colors
  colors: {
    primary: '#7678e4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: {
      primary: '#000000',
      secondary: '#666666',
      muted: '#999999',
    },
    background: {
      page: 'bg-card',
      section: 'bg-card/95',
      hover: 'hover:bg-primary/8',
    },
    border: {
      light: 'border-primary/10',
      medium: 'border-primary/20',
      dark: 'border-primary/50',
    },
    shadow: {
      primary: 'shadow-primary/10',
      secondary: 'shadow-primary/20',
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
    header: 'text-lg sm:text-xl font-bold tracking-tight',
    title: 'text-base sm:text-lg font-semibold',
    subtitle: 'text-sm font-semibold',
    body: 'text-sm',
    small: 'text-xs',
    label: 'text-xs font-medium',
  },

  // Border Radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Z-index
  zIndex: {
    sticky: 'z-20',
    modal: 'z-40',
    overlay: 'z-50',
  },

  // Animations
  animation: {
    duration: '200ms',
    timing: 'duration-200',
    transition: 'transition-all duration-200',
    hover: 'group-hover:scale-[1.02]',
  },

  // Component-specific tokens
  components: {
    header: {
      height: 'py-2 sm:py-3',
      padding: 'px-3 sm:px-4',
      button: {
        size: 'min-w-[44px] min-h-[44px]',
        padding: 'p-2 sm:p-3',
      },
    },
    card: {
      padding: 'p-3 sm:p-4',
      gap: 'gap-3',
      divider: 'divide-y divide-primary/10',
    },
    icon: {
      large: {
        size: 'size-12',
        iconSize: 'h-6 w-6',
      },
      medium: {
        size: 'size-10',
        iconSize: 'h-5 w-5',
      },
      small: {
        size: 'size-8',
        iconSize: 'h-4 w-4',
      },
    },
    section: {
      spacing: 'space-y-4',
      container: 'px-3 sm:px-4 py-4 pb-20',
    },
    chart: {
      height: 'h-64 sm:h-80',
      heightSmall: 'h-48 sm:h-64',
    },
  },
};
