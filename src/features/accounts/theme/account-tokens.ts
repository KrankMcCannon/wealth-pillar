/**
 * Account Feature Design Tokens
 * Feature-specific tokens for account management
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly account-specific patterns here
 */

import { coreTokens } from '@/styles/core-tokens';

export const accountTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Account-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      inner: 'flex items-center justify-between p-2',
      title: `${coreTokens.typography.xl} font-bold text-[${coreTokens.color.foreground}]`,
      subtitle: `${coreTokens.typography.xs} text-[${coreTokens.color.mutedForeground}]`,
      backButton: `flex items-center justify-center w-9 h-9 ${coreTokens.radius.sm} bg-primary/10 text-primary hover:bg-primary/20 transition-colors`,
      addButton: `flex items-center justify-center w-9 h-9 ${coreTokens.radius.sm} bg-primary text-primary-foreground hover:bg-primary/90 transition-colors`,
    },

    // Balance Card
    balanceCard: {
      container: `bg-[${coreTokens.color.card}] ${coreTokens.radius.lg} p-3 border border-primary/20 ${coreTokens.shadow.lg} relative overflow-hidden`,
      mainRow: 'flex flex-col gap-2.5',
      balanceSection: 'w-full',
      header: 'flex flex-col items-start',
      icon: 'hidden',
      label: 'text-[10px] font-bold text-primary/60 uppercase tracking-wider',
      value: `${coreTokens.typography.xl} sm:${coreTokens.typography['2xl']} font-extrabold tracking-tight`,
      statsGrid: 'flex flex-row items-center gap-2 w-full',
      statItem: `flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 ${coreTokens.radius.sm} border ${coreTokens.typography.xs} font-semibold transition-all duration-300`,
      statItemPrimary: 'bg-primary/5 border-primary/10 text-primary',
      statItemSuccess: 'bg-success/5 border-success/10 text-success',
      statItemDestructive: 'bg-destructive/5 border-destructive/10 text-destructive',
    },

    // Accounts List
    accountsList: {
      container: 'space-y-3',
      header: `${coreTokens.typography.lg} font-semibold text-[${coreTokens.color.foreground}] mb-4`,
      addPrompt: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 ${coreTokens.radius.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
    },

    // Slider
    slider: {
      container:
        'overflow-x-auto scrollbar-hide flex items-center touch-pan-x touch-pan-y',
      inner: 'flex gap-3',
      cardWrapper: 'transform transition-all duration-300 hover:scale-[1.01]',
      addPlaceholder: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 ${coreTokens.radius.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
      addPromptIcon: 'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
      addPromptLabel: `${coreTokens.typography.xs} text-primary/70 group-hover:text-primary font-medium transition-colors`,
    },

    // Total Balance Link
    totalBalanceLink: {
      container:
        `flex items-center justify-between p-3 bg-primary/5 ${coreTokens.radius.sm} border border-primary/25 shadow-[0_10px_26px_oklch(var(--color-primary)/0.28)] cursor-pointer hover:bg-primary/10 hover:shadow-[0_14px_32px_oklch(var(--color-primary)/0.35)] transition-all duration-300 group`,
      leftSection: 'flex items-center gap-3',
      icon: `flex items-center justify-center w-10 h-10 ${coreTokens.radius.sm} bg-primary/15`,
      label: `${coreTokens.typography.xs} mb-1 font-medium text-primary/75`,
      valuePositive: `${coreTokens.typography.xl} font-bold text-primary transition-colors duration-300`,
      valueNegative: `${coreTokens.typography.xl} font-bold text-primary transition-colors duration-300`,
      rightSection: 'flex items-center gap-2',
      badge: `flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 ${coreTokens.radius.full} border border-primary/30`,
      badgeText: `${coreTokens.typography.xs} font-bold text-primary/90`,
      arrow: `h-5 w-5 text-primary/80 group-hover:translate-x-1 transition-transform duration-300`,
    },
  },

  // ============================================================================
  // STATUS-SPECIFIC STYLES
  // Balance state indicators (positive, negative, neutral)
  // ============================================================================

  status: {
    positive: `text-[${coreTokens.color.success}]`,
    negative: `text-[${coreTokens.color.destructive}]`,
    neutral: `text-[${coreTokens.color.mutedForeground}]`,
  },
} as const;
