/**
 * Auth Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in auth-tokens.ts
 */

export const authStyles = {
  // Page background with gradient blobs
  page: {
    container: 'h-full w-full flex items-center justify-center px-0 sm:px-4 relative',
    bgBlobTop:
      'pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]',
    bgBlobBottom:
      'pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]',
  },

  // Error messages
  error: {
    container: 'mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200 flex items-start gap-2',
    icon: 'h-4 w-4 shrink-0 mt-0.5',
    text: 'flex-1',
  },

  // Form layout
  form: {
    container: 'space-y-2',
    fieldGroup: 'space-y-1',
    twoColumnGrid: 'grid grid-cols-2 gap-2',
  },

  // Label
  label: {
    base: 'text-xs font-medium text-gray-900',
  },

  // Input wrapper with icon
  input: {
    wrapper: 'relative',
    icon: 'absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60',
    field: 'pl-9 h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20 placeholder:text-primary/40',
  },

  // Checkbox
  checkbox: {
    label: 'inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none',
    input: 'size-3 rounded border-[hsl(var(--color-primary))]/30 text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20 align-middle',
  },

  // Forgot password link
  forgotPassword: {
    link: 'text-xs text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-medium',
  },

  // Primary button
  button: {
    primary: 'w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium',
    icon: 'mr-2 h-3.5 w-3.5 animate-spin',
  },

  // Divider
  divider: {
    container: 'flex items-center gap-3 py-1',
    line: 'h-px bg-[hsl(var(--color-primary))]/20 flex-1',
    text: 'text-xs text-gray-500 font-medium',
  },

  // Social buttons container
  socialButtons: {
    container: 'space-y-1.5',
    button: 'w-full h-9 transition-all duration-200 hover:opacity-95 active:scale-[.98] text-sm',
  },

  // Sign in/up toggle
  toggle: {
    container: 'text-center text-xs text-gray-600 pt-1',
    link: 'text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-semibold',
  },

  // Verification step specific styles
  verification: {
    infoText: 'text-xs text-gray-600',
    container: 'space-y-3',
    actions: 'flex items-center justify-between text-xs text-gray-600',
  },

  // Action buttons container
  actions: {
    container: 'flex items-center justify-between gap-3',
    group: 'flex items-center gap-3',
    row: 'flex items-center justify-between',
  },

  // Password input specific
  password: {
    field: 'h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20 placeholder:text-primary/40',
  },

  // Email suggestions
  emailSuggestions: {
    container: 'mt-2 space-y-2',
  },

  // Password strength indicator
  passwordStrength: {
    container: 'mt-2',
  },

  // Password requirements
  passwordRequirements: {
    container: 'mt-2 space-y-1',
  },

  // Recovery flow specific styles
  recovery: {
    backButton: 'p-1 text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 hover:bg-[hsl(var(--color-primary))]/5 rounded-md transition-colors',
    verifyActions: 'flex flex-col gap-2 w-full',
    resendLink: 'text-xs text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-medium text-center',
    backArrowButton: 'p-1 text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 rounded-md transition-colors',
  },

  // Animation
  animationWrapperCredentials: {
    animate: { opacity: 1, x: 0 },
    initial: { opacity: 0, x: 24 },
    exit: { opacity: 0, x: -24 },
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

/**
 * Helper function to get input styles with icon
 */
export function getInputStyles(withIcon: boolean = true): {
  wrapper: string;
  input: string;
} {
  return {
    wrapper: authStyles.input.wrapper,
    input: `${authStyles.input.field}${withIcon ? ' ' + authStyles.input.field : ''}`,
  };
}

/**
 * Helper function to get button loading state
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
