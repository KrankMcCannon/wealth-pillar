/**
 * Settings Design Tokens
 * Centralized design system for settings feature
 * Provides consistent spacing, colors, typography, and animations
 */

export const settingsTokens = {
  // Colors
  colors: {
    primary: '#7678e4',
    primaryLight: '#7678e4',
    primaryDark: '#5b5cb8',
    text: {
      primary: '#000000',
      secondary: '#666666',
      muted: '#999999',
    },
    background: {
      page: 'bg-card',
      section: 'bg-card/95',
      hover: 'hover:bg-[#7678e4]/8',
    },
    border: {
      light: 'border-[#7678e4]/10',
      medium: 'border-[#7678e4]/20',
      dark: 'border-[#7678e4]/50',
    },
    shadow: {
      primary: 'shadow-[#7678e4]/15',
      secondary: 'shadow-[#7678e4]/30',
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-500/20',
      shadow: 'shadow-red-500/15',
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
    sectionTitle: 'text-sm font-semibold',
    subtitle: 'text-xs',
    badge: 'text-xs font-semibold',
    body: 'text-sm',
    small: 'text-xs',
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
      padding: 'p-3',
      gap: 'gap-3',
      divider: 'divide-y divide-[#7678e4]/8',
    },
    icon: {
      badge: {
        size: 'size-16',
        iconSize: 'h-5 w-5',
      },
      small: {
        size: 'size-10',
        iconSize: 'h-5 w-5',
      },
      xs: {
        size: 'h-4 w-4',
      },
    },
    section: {
      spacing: 'space-y-6',
      main: 'px-3 sm:px-4 py-4 pb-20',
    },
  },
};
