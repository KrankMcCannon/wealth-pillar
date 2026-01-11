/**
 * Reports Feature Design Tokens
 * Feature-specific tokens for reports and analytics
 */

export const reportsTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Reports-specific component patterns
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
      padding: 'p-3 sm:p-4',
      gap: 'gap-3',
      divider: 'divide-y divide-primary/10',
    },

    // Icon sizes
    icon: {
      large: {
        size: 'size-12',
        iconSize: 'h-6 w-6',
      },
      medium: {
        size: 'size-10',
        iconSize: 'h-5 w-5',
      },
      small: {
        size: 'size-8',
        iconSize: 'h-4 w-4',
      },
    },

    // Section
    section: {
      spacing: 'space-y-4',
      container: 'px-3 sm:px-4 py-4 pb-20',
    },

    // Chart
    chart: {
      height: 'h-64 sm:h-80',
      heightSmall: 'h-48 sm:h-64',
    },
  },
} as const;
