/**
 * Budget Feature Design Tokens
 * Feature-specific tokens for budget management
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly budget-specific patterns here
 */

import { coreTokens } from '@/styles/core-tokens';

export const budgetTokens = {
  // ============================================================================
  // STATUS VARIANTS
  // Budget health indicators (safe, warning, danger)
  // Feature-specific - these don't exist in core tokens
  // ============================================================================

  status: {
    safe: {
      indicator: `bg-[${coreTokens.color.primary}]`,
      text: `text-[${coreTokens.color.primary}]`,
      message: '✅ Budget sotto controllo',
      color: 'from-green-400 to-green-500', // For gradients
    },
    warning: {
      indicator: `bg-[${coreTokens.color.warning}]`,
      text: `text-[${coreTokens.color.warning}]`,
      message: '⚠️ Attenzione, quasi esaurito',
      color: 'from-amber-400 to-amber-500', // For gradients
    },
    danger: {
      indicator: 'bg-red-500',
      text: `text-[${coreTokens.color.destructive}]`,
      message: '⚠️ Budget superato',
      color: 'from-red-500 to-red-600', // For gradients
    },
  },

  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Budget-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      container: 'px-3 sm:px-4 py-2.5',
      title: coreTokens.typography.heading,
      button: `text-[${coreTokens.color.primary}] hover:bg-[${coreTokens.color.primary}] hover:text-[${coreTokens.color.primaryForeground}] ${coreTokens.radius.md} ${coreTokens.animation.classes.transition} p-2 min-w-10 min-h-10 flex items-center justify-center`,
    },

    // Card/Section
    card: {
      base: `bg-card/90 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 ${coreTokens.shadow.lg} shadow-[0_12px_24px_oklch(var(--color-muted)/0.4)] ${coreTokens.radius.md} sm:${coreTokens.radius.lg} border border-primary/20`,
      compact: `bg-card/60 ${coreTokens.radius.md}`,
    },

    // Metrics Display
    metrics: {
      container: 'grid grid-cols-3 gap-2 sm:gap-3',
      item: `text-left p-2.5 bg-card/60 ${coreTokens.radius.sm} flex flex-col items-start gap-1`,
      label: `${coreTokens.typography.label}`,
      value: coreTokens.typography.amount,
    },

    // Progress Bar
    progress: {
      container: `bg-card/60 ${coreTokens.radius.md} space-y-3`,
      bar: `w-full h-3 ${coreTokens.radius.full} bg-primary/10`,
      fill: `h-3 ${coreTokens.radius.full} transition-all duration-700 ease-out`,
    },

    // Button
    button: {
      primary: `${coreTokens.typography.sm} font-semibold hover:bg-primary/10 ${coreTokens.radius.md} ${coreTokens.animation.classes.transition} px-5 py-2.5 min-h-10 border border-primary/20 hover:border-primary/40 hover:${coreTokens.shadow.sm}`,
    },

    // Dropdown Menu
    dropdown: {
      content: `w-56 backdrop-blur-xl border border-border/50 ${coreTokens.shadow.xl} ${coreTokens.radius.md} p-2 animate-in slide-in-from-top-2 duration-200`,
      item: `${coreTokens.typography.sm} font-medium text-[${coreTokens.color.primary}] hover:bg-[${coreTokens.color.primary}] hover:text-[${coreTokens.color.primaryForeground}] ${coreTokens.radius.sm} px-3 py-2.5 cursor-pointer transition-colors`,
    },

    // Select/Dropdown
    select: {
      trigger: `w-full h-12 sm:h-14 bg-[${coreTokens.color.card}] border border-primary/20 ${coreTokens.shadow.sm} ${coreTokens.radius.md} px-3 sm:px-4 hover:border-primary/40 focus:border-[${coreTokens.color.primary}] focus:ring-2 focus:ring-primary/20 transition-all ${coreTokens.typography.sm} font-medium`,
      content: `bg-card/95 backdrop-blur-md border border-border/60 ${coreTokens.shadow.xl} ${coreTokens.radius.md} min-w-[320px]`,
      item: `hover:bg-primary/10 ${coreTokens.radius.sm} px-3 sm:px-4 cursor-pointer font-medium group`,
    },

    // Transaction Group
    transactionGroup: {
      header: 'flex items-center justify-between mb-2 px-1',
      title: coreTokens.typography.heading,
      total: `${coreTokens.typography.sm} font-bold`,
    },

    // Chart
    chart: {
      container: `relative h-48 bg-[${coreTokens.color.card}] px-6 pb-8`,
      labels: 'relative px-1 mt-2 pb-2',
      label: `${coreTokens.typography.xs} font-medium tabular-nums`,
    },

    // Empty State
    emptyState: {
      container: 'text-center py-12',
      icon: `w-16 h-16 bg-primary/10 ${coreTokens.radius.lg} flex items-center justify-center mb-4 mx-auto`,
      title: `${coreTokens.typography.lg} font-semibold mb-2`,
      text: coreTokens.typography.sm,
    },
  },
} as const;
