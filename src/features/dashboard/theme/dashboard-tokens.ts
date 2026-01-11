/**
 * Dashboard Feature Design Tokens
 * Feature-specific tokens for dashboard layout and components
 *
 * Uses centralized style registry from @/styles/system
 * Only defines truly dashboard-specific patterns here
 */

import { radiusStyles } from "@/styles/system";

export const dashboardTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Dashboard-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      height: '3.5rem',
      padding: '1rem',
      background: 'oklch(var(--color-card)/0.8)',
      borderColor: 'oklch(var(--color-foreground)/0.1)',
    },

    // Section
    section: {
      padding: '1rem',
      gap: '1rem',
      borderRadius: radiusStyles.raw.lg,
    },

    // Card
    card: {
      padding: '1rem',
      borderRadius: radiusStyles.raw.lg,
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
    },

    // Account section
    account: {
      padding: '0.75rem',
      borderRadius: radiusStyles.raw.md,
      gap: '0.5rem',
    },

    // Budget section
    budget: {
      padding: '1rem',
      borderRadius: radiusStyles.raw.lg,
      gap: '0.75rem',
    },

    // Recurring section
    recurring: {
      padding: '1rem',
      borderRadius: radiusStyles.raw.lg,
      gap: '0.5rem',
    },
  },
} as const;
