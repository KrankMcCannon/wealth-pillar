/**
 * Settings Feature Design Tokens
 * Feature-specific tokens for settings and preferences
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly settings-specific patterns here
 *
 * CRITICAL FIX: Replaced ALL hardcoded #7678e4 instances with coreTokens.color.primary
 * to unify primary color across all features
 */

import { coreTokens } from '@/styles/core-tokens';

export const settingsTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Settings-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      height: 'py-2 sm:py-3',
      padding: 'px-3 sm:px-4',
      button: {
        size: 'min-w-[44px] min-h-[44px]',
        padding: 'p-2 sm:p-3',
      },
    },

    // Card
    card: {
      padding: 'p-3',
      gap: 'gap-3',
      divider: 'divide-y divide-primary/10',
    },

    // Icon sizes
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

    // Section
    section: {
      spacing: 'space-y-6',
      main: 'px-3 sm:px-4 py-4 pb-20',
    },

    // Error states (settings-specific)
    error: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-500/20',
      shadow: 'shadow-red-500/15',
    },
  },
} as const;
