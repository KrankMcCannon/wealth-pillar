/**
 * Auth Style Utilities
 * Organized by component section for consistency and maintainability
 * Uses centralized style registry from @/styles/system
 */

import { animationStyles, radiusStyles, typographyStyles } from "@/styles/system";
import { authTokens } from "./auth-tokens";

export const authStyles = {
  // ============================================================================
  // PAGE LAYOUT
  // Full-page container with decorative background blobs
  // ============================================================================

  page: {
    container:
      'h-full w-full flex items-center justify-center px-0 sm:px-4 relative',
    bgBlobTop: "pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-primary",
    bgBlobBottom: "pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-secondary",
  },
  layout: {
    container: 'h-dvh w-screen bg-background flex items-center justify-center relative overflow-hidden',
    main: 'w-full h-full flex items-center justify-center',
    footer: 'absolute bottom-2 left-0 right-0',
    footerText: `mx-auto max-w-6xl px-4 text-center ${typographyStyles.xs} text-primary/60`,
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
    base: `${typographyStyles.label} text-foreground`,
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
  // SOCIAL BUTTONS
  // OAuth provider buttons container
  // ============================================================================

  socialButtons: {
    container: 'space-y-1.5',
    button: `w-full h-9 ${animationStyles.classes.transition} hover:opacity-95 active:scale-[.98] ${typographyStyles.sm}`,
    base: 'bg-white text-black border border-primary hover:border-primary/40 transition-all shadow-sm',
    google: 'hover:bg-primary/5',
    apple: 'hover:bg-secondary/5',
    github: 'hover:bg-accent/5',
    icon: 'h-4 w-4 mr-2',
    iconSecondary: 'text-secondary',
    iconAccent: 'text-accent',
  },
  card: {
    container: 'w-full max-w-md mx-auto px-2 sm:px-4',
    surface: 'rounded-2xl bg-white p-4 sm:p-5 shadow-xl border border-primary/20',
    header: 'mb-3',
    headerRow: 'flex items-center gap-2 justify-center mb-2',
    headerSlot: 'shrink-0 w-6 h-6',
    headerSlotSpacer: 'shrink-0 w-6',
    headerCenter: 'flex-1 text-center',
    brand: 'text-primary text-xl font-bold tracking-tight',
    title: 'text-xl font-bold text-primary tracking-tight mt-0.5',
    subtitle: 'text-center text-xs text-black/60',
  },
  userButton: {
    trigger: 'flex items-center gap-2 px-2 py-1 h-auto',
    avatarWrap: 'w-8 h-8 rounded-xl overflow-hidden bg-primary/10',
    avatarImage: 'h-full w-full object-cover',
    nameWrap: 'flex flex-col items-start text-left',
    name: 'text-sm font-medium',
    role: 'text-xs capitalize',
    menu: 'w-56',
    menuLabel: 'flex flex-col space-y-1',
    menuName: 'text-sm font-medium leading-none',
    menuEmail: 'text-xs leading-none',
    menuRole: 'text-xs leading-none capitalize',
    menuIcon: 'mr-2 h-4 w-4',
    destructiveItem: 'text-destructive focus:text-destructive',
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
