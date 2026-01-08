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

  // Terms and conditions toggle
  toggle: {
    container: 'text-center text-xs text-gray-600 pt-1',
    link: 'text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-semibold',
  },

  // Action buttons container
  actions: {
    container: 'flex items-center justify-between gap-3',
    group: 'flex items-center gap-3',
    row: 'flex items-center justify-between',
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
