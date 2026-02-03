/**
 * Auth Style Utilities
 * Organized by component section for consistency and maintainability
 * Uses centralized style registry from @/styles/system
 */

import { radiusStyles, typographyStyles, spacingStyles } from "@/styles/system";

const authTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Only auth-specific component patterns (not generic primitives)
  // ============================================================================

  components: {
    // Card layout
    card: {
      padding: spacingStyles.card.large, // p-8 (32px) - generous auth card spacing
      spacing: 'space-y-4', // Vertical spacing between card sections
    },

    // Form structure
    form: {
      group: 'space-y-2', // Spacing between form groups (label + input)
      field: 'space-y-1', // Spacing within a field (label to input)
    },

    // Divider styling (for "or continue with" sections)
    divider: 'flex items-center gap-3 py-1',
  },

  // ============================================================================
  // AUTH-SPECIFIC INPUT STYLES
  // Custom input styling for authentication forms
  // ============================================================================

  input: {
    // Base input field
    base: "h-9 text-sm bg-input border-primary/20 focus:border-primary/20 focus:ring-primary/20",

    // Input icon styling (for prefix icons)
    icon: 'h-3.5 w-3.5 text-primary/60',
  },

  // ============================================================================
  // AUTH-SPECIFIC BUTTON STYLES
  // Primary action button for auth forms
  // ============================================================================

  button: {
    // Primary auth button (sign in, sign up, etc.)
    primary: "w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium",
  },

  // ============================================================================
  // ERROR & SUCCESS STATE COLORS
  // Auth-specific semantic colors for form validation
  // ============================================================================

  validation: {
    error: {
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      text: "text-destructive",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
    },
  },
} as const;

export const authStyles = {
  // ============================================================================
  // PAGE LAYOUT
  // Full-page container with decorative background blobs
  // ============================================================================

  page: {
    container:
      'h-full w-full flex items-center justify-center px-0 sm:px-4 relative',
    wrapper: 'flex w-full justify-center py-12 relative z-10',
    bgBlobTop: "pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-primary",
    bgBlobBottom: "pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-secondary",
  },
  layout: {
    container: 'h-screen w-screen bg-card flex flex-col relative overflow-hidden',
    main: 'w-full flex-1 flex items-center justify-center px-4 py-6',
    footer:
      'mt-auto w-full px-4 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))] pt-2',
    footerText: `mx-auto max-w-6xl text-center ${typographyStyles.xs} text-primary/60`,
  },
  loading: {
    container: 'flex flex-col items-center justify-center py-8 space-y-4',
    spinner: "h-12 w-12 animate-spin text-primary",
    spinnerRing: 'border-b-2 border-current rounded-full',
    text: `${typographyStyles.sm} text-center text-muted-foreground`,
  },
  errorPage: {
    container: 'space-y-4',
    description: `${typographyStyles.sm} text-center text-muted-foreground`,
    retryButton: `w-full px-4 py-2 bg-primary text-primary-foreground ${radiusStyles.sm} hover:opacity-90 transition-opacity`,
    backLink: `${typographyStyles.sm} block text-center text-muted-foreground hover:text-foreground transition-colors`,
  },

  // ============================================================================
  // ERROR MESSAGES
  // Error display for form validation failures
  // ============================================================================

  error: {
    container: `mb-2 ${radiusStyles.sm} bg-destructive/10 p-2 ${typographyStyles.xs} text-destructive border border-destructive/20 flex items-start gap-2`,
    icon: 'h-4 w-4 shrink-0 mt-0.5',
    text: 'flex-1',
  },

  // ============================================================================
  // FORM LAYOUT
  // Form structure using auth component tokens
  // ============================================================================

  form: {
    container: authTokens.components.form.group,
    fieldGroup: authTokens.components.form.field,
  },

  // ============================================================================
  // LABEL
  // Form field labels
  // ============================================================================

  label: {
    base: `${typographyStyles.label} text-primary`,
  },

  // ============================================================================
  // INPUT WRAPPER
  // Input field with optional icon prefix
  // ============================================================================

  input: {
    wrapper: 'relative',
    icon: authTokens.input.icon,
    field: `pl-9 ${authTokens.input.base} placeholder:text-primary/40`,
  },

  // ============================================================================
  // BUTTONS
  // Primary action button and loading spinner
  // ============================================================================

  button: {
    primary: `${authTokens.button.primary} ${radiusStyles.md}`,
    icon: `mr-2 h-3.5 w-3.5 animate-spin`,
  },

  // ============================================================================
  // DIVIDER
  // "Or continue with" divider section
  // ============================================================================

  divider: {
    container: authTokens.components.divider,
    line: 'h-px bg-primary/20 flex-1',
    text: `${typographyStyles.xs} text-muted-foreground font-medium`,
  },

  // ============================================================================
  // TERMS & CONDITIONS
  // Bottom links for sign-in/sign-up toggle
  // ============================================================================

  toggle: {
    container: `text-center ${typographyStyles.xs} text-muted-foreground pt-1`,
    text: `${typographyStyles.xs} text-muted-foreground`,
    link: "text-primary hover:text-primary/80 font-semibold",
  },

  // ============================================================================
  // CARD
  // Card container and surface styles
  // ============================================================================

  card: {
    container: 'w-full max-w-md mx-auto px-2 sm:px-4',
    surface: 'rounded-2xl bg-card p-4 sm:p-5 shadow-xl border border-primary/20',
    header: 'mb-3',
    headerRow: 'flex items-center gap-2 justify-center mb-2',
    headerSlot: 'shrink-0 w-6 h-6',
    headerSlotSpacer: 'shrink-0 w-6',
    headerCenter: 'flex-1 text-center',
    brand: 'text-primary text-xl font-bold tracking-tight',
    title: 'text-xl font-bold text-primary tracking-tight mt-0.5',
    subtitle: 'text-center text-xs text-primary/60',
  },

  // ============================================================================
  // ACTION BUTTONS
  // Container layouts for action buttons
  // ============================================================================

  actions: {
    container: 'flex items-center justify-between gap-3',
    group: 'flex items-center gap-3',
    row: 'flex items-center justify-between',
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// Utilities for dynamic styling based on state
// ============================================================================

/**
 * Get input styles with optional icon
 * @param withIcon - Whether to include icon spacing
 * @returns Object with wrapper and input class strings
 */
export function getInputStyles(withIcon: boolean = true): {
  wrapper: string;
  input: string;
} {
  return {
    wrapper: authStyles.input.wrapper,
    input: withIcon
      ? authStyles.input.field
      : authStyles.input.field.replace('pl-9', 'px-3'),
  };
}

/**
 * Get button loading state
 * @param isLoading - Whether the button is in loading state
 * @returns Object with disabled state and opacity class
 */
export function getButtonLoadingState(isLoading: boolean): {
  disabled: boolean;
  opacity: string;
} {
  return {
    disabled: isLoading,
    opacity: isLoading ? 'opacity-70' : 'opacity-100',
  };
}
