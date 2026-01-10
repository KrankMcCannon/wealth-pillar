/**
 * Auth Feature Design Tokens
 * Feature-specific tokens for authentication pages
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly auth-specific patterns here
 */

import { coreTokens } from '@/styles/core-tokens';

export const authTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Only auth-specific component patterns (not generic primitives)
  // ============================================================================

  components: {
    // Card layout
    card: {
      padding: coreTokens.spacing.card.large, // p-8 (32px) - generous auth card spacing
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
    base: `h-9 text-sm bg-[${coreTokens.color.input}] border-primary/20 focus:border-[${coreTokens.color.primary}] focus:ring-primary/20`,

    // Input icon styling (for prefix icons)
    icon: 'h-3.5 w-3.5 text-primary/60',
  },

  // ============================================================================
  // AUTH-SPECIFIC BUTTON STYLES
  // Primary action button for auth forms
  // ============================================================================

  button: {
    // Primary auth button (sign in, sign up, etc.)
    primary: `w-full h-9 bg-[${coreTokens.color.primary}] hover:bg-primary/90 text-[${coreTokens.color.primaryForeground}] transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium`,
  },

  // ============================================================================
  // ERROR & SUCCESS STATE COLORS
  // Auth-specific semantic colors for form validation
  // ============================================================================

  validation: {
    error: {
      bg: 'oklch(var(--color-destructive)/0.1)', // Light red background
      border: 'oklch(var(--color-destructive)/0.2)', // Red border
      text: coreTokens.color.destructive, // Red text
    },
    success: {
      bg: 'oklch(var(--color-success)/0.1)', // Light green background
      text: coreTokens.color.successDark, // Dark green text
    },
  },
} as const;
