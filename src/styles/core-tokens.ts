/**
 * Core Design Tokens
 * References CSS variables from app/globals.css
 * Single source of truth for all shared design primitives across features
 *
 * @module core-tokens
 * @see /app/globals.css - Source of truth for CSS variables
 *
 * Usage:
 * ```typescript
 * import { coreTokens } from '@/styles/core-tokens';
 *
 * const myColor = coreTokens.color.primary; // 'var(--color-primary)'
 * const myColorAlpha = 'oklch(var(--color-primary)/0.5)';
 * ```
 */

export const coreTokens = {
  // ============================================================================
  // COLORS - Reference CSS variables using raw value format
  // All colors reference app/globals.css CSS custom properties
  // ============================================================================
  color: {
    // Brand colors
    primary: 'var(--color-primary)',
    primaryForeground: 'var(--color-primary-foreground)',
    secondary: 'var(--color-secondary)',
    secondaryForeground: 'var(--color-secondary-foreground)',
    accent: 'var(--color-accent)',
    accentForeground: 'var(--color-accent-foreground)',

    // Semantic colors
    destructive: 'var(--color-destructive)',
    destructiveForeground: 'var(--color-destructive-foreground)',
    warning: 'var(--color-warning)',
    warningForeground: 'var(--color-warning-foreground)',
    success: 'var(--color-success)',
    successLight: 'var(--color-success-light)',
    successDark: 'var(--color-success-dark)',
    successForeground: 'var(--color-success-foreground)',

    // UI colors
    background: 'var(--color-background)',
    foreground: 'var(--color-foreground)',
    card: 'var(--color-card)',
    cardForeground: 'var(--color-card-foreground)',
    popover: 'var(--color-popover)',
    popoverForeground: 'var(--color-popover-foreground)',
    muted: 'var(--color-muted)',
    mutedForeground: 'var(--color-muted-foreground)',
    border: 'var(--color-border)',
    input: 'var(--color-input)',
    ring: 'var(--color-ring)',

    // Sidebar (for future use)
    sidebar: 'var(--color-sidebar)',
    sidebarForeground: 'var(--color-sidebar-foreground)',
    sidebarPrimary: 'var(--color-sidebar-primary)',
    sidebarPrimaryForeground: 'var(--color-sidebar-primary-foreground)',
    sidebarAccent: 'var(--color-sidebar-accent)',
    sidebarAccentForeground: 'var(--color-sidebar-accent-foreground)',
    sidebarBorder: 'var(--color-sidebar-border)',
    sidebarRing: 'var(--color-sidebar-ring)',
  },

  // ============================================================================
  // SPACING - Standardized rem-based system (Tailwind default)
  // Follows Tailwind's spacing scale for consistency and accessibility
  // ============================================================================
  spacing: {
    // Base scale (rem-based for accessibility)
    xs: '0.125rem', // 2px
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    '4xl': '2.5rem', // 40px
    '5xl': '3rem', // 48px
    '6xl': '4rem', // 64px

    // Responsive page spacing (Tailwind classes for mobile-first approach)
    page: {
      mobile: 'p-3', // 12px
      tablet: 'sm:p-4', // 16px
      desktop: 'md:p-6', // 24px
    },

    // Section-level responsive spacing
    section: {
      mobile: 'px-3 py-4', // horizontal: 12px, vertical: 16px
      tablet: 'sm:px-4 sm:py-6', // horizontal: 16px, vertical: 24px
      desktop: 'md:px-6 md:py-8', // horizontal: 24px, vertical: 32px
    },

    // Card spacing variants
    card: {
      compact: 'p-3', // 12px - tight spacing
      default: 'p-4', // 16px - standard spacing
      comfortable: 'p-6', // 24px - generous spacing
      large: 'p-8', // 32px - extra generous
    },
  },

  // ============================================================================
  // TYPOGRAPHY - Semantic text styles
  // Uses Tailwind classes for consistent typography across features
  // ============================================================================
  typography: {
    // Size scale
    xs: 'text-xs', // 0.75rem (12px)
    sm: 'text-sm', // 0.875rem (14px)
    base: 'text-base', // 1rem (16px)
    lg: 'text-lg', // 1.125rem (18px)
    xl: 'text-xl', // 1.25rem (20px)
    '2xl': 'text-2xl', // 1.5rem (24px)
    '3xl': 'text-3xl', // 1.875rem (30px)

    // Semantic typography (consistent across features)
    heading: 'text-lg sm:text-xl font-bold tracking-tight',
    subheading: 'text-base font-semibold',
    body: 'text-sm',
    bodySmall: 'text-xs',
    label: 'text-xs font-medium',
    caption: 'text-xs text-muted-foreground',

    // Financial-specific typography
    amount: 'text-lg sm:text-xl font-bold tracking-tight',
    amountLarge: 'text-2xl sm:text-3xl font-bold tracking-tight',
  },

  // ============================================================================
  // BORDER RADIUS - Consistent corner rounding
  // Uses Tailwind classes that reference globals.css --radius variables
  // ============================================================================
  radius: {
    sm: 'rounded-lg', // 0.5rem (--radius-sm)
    md: 'rounded-xl', // 0.75rem (--radius-md)
    lg: 'rounded-2xl', // 1rem (--radius-lg, --radius)
    xl: 'rounded-3xl', // 1.5rem (--radius-xl)
    full: 'rounded-full', // 9999px

    // Raw values for programmatic use
    raw: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
    },
  },

  // ============================================================================
  // SHADOWS - Elevation system
  // References globals.css shadow variables for consistent depth
  // ============================================================================
  shadow: {
    // Base shadows (reference globals.css --shadow-* variables)
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',

    // Semantic shadows
    card: 'shadow-sm',
    elevated: 'shadow-lg',
    modal: 'shadow-xl',

    // Raw values for inline styles
    raw: {
      xs: '0 1px 2px 0 oklch(0% 0 0 / 0.05)',
      sm: '0 1px 3px 0 oklch(0% 0 0 / 0.1), 0 1px 2px 0 oklch(0% 0 0 / 0.06)',
      md: '0 4px 6px -1px oklch(0% 0 0 / 0.1), 0 2px 4px -1px oklch(0% 0 0 / 0.06)',
    },
  },

  // ============================================================================
  // Z-INDEX - Unified stacking context scale
  // Single source of truth for all z-index values across features
  // ============================================================================
  zIndex: {
    // Numeric values (for programmatic use)
    hide: -1,
    base: 0,
    raised: 10,
    dropdown: 20,
    sticky: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,

    // Tailwind classes (for className usage)
    classes: {
      raised: 'z-10',
      dropdown: 'z-20',
      sticky: 'z-30',
      modal: 'z-40',
      popover: 'z-50',
      tooltip: 'z-[60]',
    },
  },

  // ============================================================================
  // ANIMATIONS - Shared timing and transitions
  // Consistent animation parameters across features
  // ============================================================================
  animation: {
    // Duration values
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },

    // Timing functions
    timing: {
      default: 'ease-in-out',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      linear: 'linear',
      spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Tailwind classes (for className usage)
    classes: {
      fast: 'duration-150',
      normal: 'duration-200',
      slow: 'duration-300',
      transition: 'transition-all duration-200',
      transitionFast: 'transition-all duration-150',
      transitionSlow: 'transition-all duration-300',
    },
  },
} as const;

// ============================================================================
// ============================================================================
// TYPE EXPORTS - For type-safe token usage
// ============================================================================

export type ColorToken = keyof typeof coreTokens.color;
export type SpacingToken = keyof typeof coreTokens.spacing;
export type TypographyToken = keyof typeof coreTokens.typography;
export type RadiusToken = keyof typeof coreTokens.radius;
export type ShadowToken = keyof typeof coreTokens.shadow;
export type ZIndexToken = keyof typeof coreTokens.zIndex;
export type AnimationDurationToken =
  keyof typeof coreTokens.animation.duration;
export type AnimationTimingToken = keyof typeof coreTokens.animation.timing;
