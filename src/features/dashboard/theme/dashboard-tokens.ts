/**
 * Dashboard Feature Design Tokens
 * Feature-specific tokens for dashboard layout and components
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly dashboard-specific patterns here
 */

import { coreTokens } from '@/styles/core-tokens';

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
      borderRadius: coreTokens.radius.raw.lg,
    },

    // Card
    card: {
      padding: '1rem',
      borderRadius: coreTokens.radius.raw.lg,
      background: coreTokens.color.card,
      border: `1px solid ${coreTokens.color.border}`,
    },

    // Account section
    account: {
      padding: '0.75rem',
      borderRadius: coreTokens.radius.raw.md,
      gap: '0.5rem',
    },

    // Budget section
    budget: {
      padding: '1rem',
      borderRadius: coreTokens.radius.raw.lg,
      gap: '0.75rem',
    },

    // Recurring section
    recurring: {
      padding: '1rem',
      borderRadius: coreTokens.radius.raw.lg,
      gap: '0.5rem',
    },
  },
} as const;
