/**
 * Account Feature Design Tokens
 * Feature-specific tokens for account management
 *
 * Uses centralized style registry from @/styles/system
 * Only defines truly account-specific patterns here
 */

import { radiusStyles, shadowStyles, typographyStyles } from "@/styles/system";

export const accountTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Account-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      inner: 'flex items-center justify-between p-2',
      title: `${typographyStyles.xl} font-bold text-foreground`,
      subtitle: `${typographyStyles.xs} text-muted-foreground`,
      backButton: `flex items-center justify-center w-9 h-9 ${radiusStyles.sm} bg-primary/10 text-primary hover:bg-primary/20 transition-colors`,
      addButton: `flex items-center justify-center w-9 h-9 ${radiusStyles.sm} bg-primary text-primary-foreground hover:bg-primary/90 transition-colors`,
    },

    // Balance Card
    balanceCard: {
      container: `bg-card ${radiusStyles.lg} p-3 border border-primary/20 ${shadowStyles.lg} relative overflow-hidden`,
      mainRow: 'flex flex-col gap-2.5',
      balanceSection: 'w-full',
      header: 'flex flex-col items-start',
      icon: 'hidden',
      label: 'text-[10px] font-bold text-primary/60 uppercase tracking-wider',
      value: `${typographyStyles.xl} sm:${typographyStyles["2xl"]} font-extrabold tracking-tight`,
      statsGrid: 'flex flex-row items-center gap-2 w-full',
      statItem: `flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 ${radiusStyles.sm} border ${typographyStyles.xs} font-semibold transition-all duration-300`,
      statItemPrimary: 'bg-primary/5 border-primary/10 text-primary',
      statItemSuccess: 'bg-success/5 border-success/10 text-success',
      statItemDestructive: 'bg-destructive/5 border-destructive/10 text-destructive',
    },

    // Accounts List
    accountsList: {
      container: 'space-y-3',
      header: `${typographyStyles.lg} font-semibold text-foreground mb-4`,
      addPrompt: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
    },

    // Slider
    slider: {
      container:
        'overflow-x-auto scrollbar-hide flex items-center touch-pan-x touch-pan-y',
      inner: 'flex gap-3',
      cardWrapper: 'transform transition-all duration-300 hover:scale-[1.01]',
      addPlaceholder: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
      addPromptIcon: 'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
      addPromptLabel: `${typographyStyles.xs} text-primary/70 group-hover:text-primary font-medium transition-colors`,
    },

    // Total Balance Link
    totalBalanceLink: {
      container:
        `flex items-center justify-between p-3 bg-primary/5 ${radiusStyles.sm} border border-primary/25 shadow-[0_10px_26px_oklch(var(--color-primary)/0.28)] cursor-pointer hover:bg-primary/10 hover:shadow-[0_14px_32px_oklch(var(--color-primary)/0.35)] transition-all duration-300 group`,
      leftSection: "flex items-center gap-3",
      icon: `flex items-center justify-center w-10 h-10 ${radiusStyles.sm} bg-primary/15`,
      label: `${typographyStyles.xs} mb-1 font-medium text-primary/75`,
      valuePositive: `${typographyStyles.xl} font-bold text-primary transition-colors duration-300`,
      valueNegative: `${typographyStyles.xl} font-bold text-primary transition-colors duration-300`,
      rightSection: 'flex items-center gap-2',
      badge: `flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 ${radiusStyles.full} border border-primary/30`,
      badgeText: `${typographyStyles.xs} font-bold text-primary/90`,
      arrow: `h-5 w-5 text-primary/80 group-hover:translate-x-1 transition-transform duration-300`,
    },
  },

  // ============================================================================
  // STATUS-SPECIFIC STYLES
  // Balance state indicators (positive, negative, neutral)
  // ============================================================================

  status: {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  },
} as const;
