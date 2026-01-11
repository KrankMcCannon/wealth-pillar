/**
 * Auth Feature Design Tokens
 * Feature-specific tokens for authentication pages
 *
 * Uses centralized style registry from @/styles/system
 * Only defines truly auth-specific patterns here
 */

import { spacingStyles } from "@/styles/system";

export const authTokens = {
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
    base: "h-9 text-sm bg-input border-primary/20 focus:border-primary focus:ring-primary/20",

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
