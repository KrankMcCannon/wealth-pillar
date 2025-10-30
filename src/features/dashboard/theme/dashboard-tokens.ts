/**
 * Dashboard Design Tokens
 * Centralized design system values for dashboard feature
 */

export const dashboardTokens = {
  // Colors
  colors: {
    background: {
      primary: '#F8FAFC',
      secondary: '#FFFFFF',
      tertiary: 'rgba(248, 250, 252, 0.8)',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      tertiary: '#94A3B8',
    },
    border: {
      primary: '#E2E8F0',
      secondary: 'rgba(226, 232, 240, 0.5)',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
  },

  // Typography
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Border Radius
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    full: '9999px',
  },

  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },

  // Animations
  animations: {
    duration: {
      fastest: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      slowest: '1000ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      linear: 'linear',
    },
  },

  // Component-specific tokens
  components: {
    header: {
      height: '3.5rem',
      padding: '1rem',
      background: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(30, 41, 59, 0.1)',
    },
    section: {
      padding: '1rem',
      gap: '1rem',
      borderRadius: '0.75rem',
    },
    card: {
      padding: '1rem',
      borderRadius: '0.75rem',
      background: 'white',
      border: '1px solid #E2E8F0',
    },
    account: {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      gap: '0.5rem',
    },
    budget: {
      padding: '1rem',
      borderRadius: '0.75rem',
      gap: '0.75rem',
    },
    recurring: {
      padding: '1rem',
      borderRadius: '0.75rem',
      gap: '0.5rem',
    },
  },
} as const;
