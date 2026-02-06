/**
 * Account Feature Style Utilities
 * Reusable style combinations using design tokens
 *
 * This file exports className strings grouped by component.
 * Modify styles in one place and they apply everywhere.
 *
 * Usage:
 * import { accountStyles } from '@/features/accounts/theme/account-styles';
 * className={accountStyles.header.container}
 */

import type { CSSProperties } from 'react';
import { radiusStyles, shadowStyles, typographyStyles, spacingStyles } from '@/styles/system';

const accountTokens = {
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // Account-specific component patterns
  // ============================================================================

  components: {
    // Header
    header: {
      inner: 'flex items-center justify-between p-2',
      title: `${typographyStyles.xl} font-bold text-primary`,
      subtitle: `${typographyStyles.xs} text-muted-primary`,
      backButton: `flex items-center justify-center w-9 h-9 ${radiusStyles.sm} bg-primary/10 text-primary hover:bg-primary/20 transition-colors`,
      addButton: `flex items-center justify-center w-9 h-9 ${radiusStyles.sm} bg-primary text-primary-primary hover:bg-primary/90 transition-colors`,
    },

    // Balance Card
    balanceCard: {
      container: `bg-card ${radiusStyles.lg} p-3 border border-primary/20 ${shadowStyles.lg} relative overflow-hidden`,
      mainRow: 'flex flex-col gap-2.5',
      balanceSection: 'w-full',
      header: 'flex flex-col items-start',
      icon: 'hidden',
      label: 'text-[10px] font-bold text-primary/60 uppercase tracking-wider',
      value: `${typographyStyles.xl} sm:${typographyStyles['2xl']} font-bold tracking-tight`,
      statsGrid: 'flex flex-row items-center gap-2 w-full',
      statItem: `flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 ${radiusStyles.sm} border ${typographyStyles.xs} font-semibold transition-all duration-300`,
      statItemPrimary: 'bg-primary/5 border-primary/10 text-primary',
      statItemSuccess: 'bg-success/5 border-success/10 text-success',
      statItemDestructive: 'bg-destructive/5 border-destructive/10 text-destructive',
    },

    // Accounts List
    accountsList: {
      container: 'space-y-3',
      header: `${typographyStyles.lg} font-semibold text-primary mb-4`,
      addPrompt: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/20 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
    },

    // Slider
    slider: {
      container: 'overflow-x-auto scrollbar-hide flex items-center touch-pan-x touch-pan-y',
      inner: 'flex gap-3',
      cardWrapper: 'transform transition-all duration-300 hover:scale-[1.01]',
      addPlaceholder: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/20 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
      addPromptIcon:
        'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
      addPromptLabel: `${typographyStyles.xs} text-primary/70 group-hover:text-primary font-medium transition-colors`,
    },

    // Total Balance Link
    totalBalanceLink: {
      container: `flex items-center justify-between p-3 bg-primary/5 ${radiusStyles.sm} border border-primary/25 shadow-[0_10px_26px_oklch(var(--color-primary)/0.28)] cursor-pointer hover:bg-primary/10 hover:shadow-[0_14px_32px_oklch(var(--color-primary)/0.35)] transition-all duration-300 group`,
      leftSection: 'flex items-center gap-3',
      icon: `flex items-center justify-center w-10 h-10 ${radiusStyles.sm} bg-primary/15`,
      label: `${typographyStyles.xs} mb-1 font-medium text-primary/75`,
      valuePositive: `${typographyStyles.xl} font-bold text-primary transition-colors duration-300`,
      valueNegative: `${typographyStyles.xl} font-bold text-primary transition-colors duration-300`,
      rightSection: 'flex items-center gap-2',
      badge: `flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 ${radiusStyles.full} border border-primary/20`,
      badgeText: `${typographyStyles.xs} font-bold text-primary/90`,
      arrow: `h-5 w-5 text-primary/80 group-hover:translate-x-1 transition-transform duration-300`,
    },
  },

  // ============================================================================
  // STATUS-SPECIFIC STYLES
  // Balance state indicators (positive, negative, neutral)
  // ============================================================================

  status: {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  },
} as const;

export const accountStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `bg-card pb-32`, // Increased bottom padding to prevent overlap with bottom navigation
  },
  loading: {
    body: 'flex-1',
    main: 'space-y-6 px-4 py-6',
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    inner: accountTokens.components.header.inner,
    title: accountTokens.components.header.title,
    subtitle: accountTokens.components.header.subtitle,
    backButton: accountTokens.components.header.backButton,
    addButton: accountTokens.components.header.addButton,
    leftSection: 'flex items-center gap-3 flex-1',
    rightSection: 'flex items-center gap-2',
  },

  // ====================================
  // Balance Card styles
  // ====================================
  balanceCard: {
    container: `${spacingStyles.page.mobile} py-4`,
    card: accountTokens.components.balanceCard.container,
    mainRow: accountTokens.components.balanceCard.mainRow,
    balanceSection: accountTokens.components.balanceCard.balanceSection,
    header: accountTokens.components.balanceCard.header,
    iconContainer: accountTokens.components.balanceCard.icon,
    label: accountTokens.components.balanceCard.label,
    value: accountTokens.components.balanceCard.value,
    valuePositive: `${accountTokens.components.balanceCard.value} ${accountTokens.status.positive}`,
    valueNegative: `${accountTokens.components.balanceCard.value} ${accountTokens.status.negative}`,
    statsGrid: accountTokens.components.balanceCard.statsGrid,
    statItem: {
      primary: accountTokens.components.balanceCard.statItemPrimary,
      success: accountTokens.components.balanceCard.statItemSuccess,
      destructive: accountTokens.components.balanceCard.statItemDestructive,
      base: accountTokens.components.balanceCard.statItem,
    },
    statLabel: 'opacity-90 font-medium',
    statValue: 'ml-1 font-bold text-sm',
  },

  // ====================================
  // Accounts List styles
  // ====================================
  accountsList: {
    container: `${spacingStyles.page.mobile} pb-14`,
    header: accountTokens.components.accountsList.header,
    items: accountTokens.components.accountsList.container,
    addPrompt: accountTokens.components.accountsList.addPrompt,
    groupCard: 'bg-card rounded-xl border border-primary/20 shadow-sm overflow-hidden',
    groupItems: 'divide-y divide-primary/20',
    addPromptText: 'text-center',
    addPromptIcon:
      'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
    addPromptLabel:
      'text-xs text-primary/70 group-hover:text-primary font-medium transition-colors',
  },

  // ====================================
  // Empty State
  // ====================================
  emptyState: {
    container: 'text-center py-12',
    icon: 'flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4',
    iconContent: 'w-8 h-8 text-primary',
    title: 'text-muted-foreground mb-2',
    subtitle: 'text-sm text-muted-foreground/70',
  },

  // ====================================
  // Account Slider (Dashboard)
  // ====================================
  slider: {
    container: `${accountTokens.components.slider.container} mb-4`,
    inner: accountTokens.components.slider.inner,
    cardWrapper: accountTokens.components.slider.cardWrapper,
    card: 'border border-primary/20 rounded-xl overflow-hidden',
    addPlaceholder: accountTokens.components.slider.addPlaceholder,
    addPromptIcon: accountTokens.components.slider.addPromptIcon,
    addPromptLabel: accountTokens.components.slider.addPromptLabel,
    addPlaceholderContent: 'text-center',
    skeletonCard:
      'shrink-0 w-60 h-24 bg-primary/10 rounded-lg animate-pulse border border-primary/20',
    scrollStyle: {
      WebkitOverflowScrolling: 'touch',
    } satisfies CSSProperties,
    innerStyle: {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    } satisfies CSSProperties,
    cardDelayStyle: (index: number): CSSProperties => ({
      animationDelay: `${index * 100}ms`,
    }),
  },

  // ====================================
  // Total Balance Link (Dashboard)
  // ====================================
  totalBalanceLink: {
    container: accountTokens.components.totalBalanceLink.container,
    leftSection: accountTokens.components.totalBalanceLink.leftSection,
    icon: accountTokens.components.totalBalanceLink.icon,
    iconSvg: 'h-5 w-5 text-primary',
    label: accountTokens.components.totalBalanceLink.label,
    valuePositive: accountTokens.components.totalBalanceLink.valuePositive,
    valueNegative: accountTokens.components.totalBalanceLink.valueNegative,
    rightSection: accountTokens.components.totalBalanceLink.rightSection,
    badge: accountTokens.components.totalBalanceLink.badge,
    badgeText: accountTokens.components.totalBalanceLink.badgeText,
    arrow: accountTokens.components.totalBalanceLink.arrow,
  },
  // ====================================
  // Balance Section (Dashboard)
  // ====================================
  balanceSection: {
    container: 'bg-card',
  },

  // ====================================
  // Skeletons
  // ====================================
  skeleton: {
    header: {
      container: 'sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-primary/20',
      row: 'flex items-center justify-between px-4 py-4',
      left: 'flex items-center gap-3 flex-1',
      icon: 'w-9 h-9 bg-primary/10 rounded-lg animate-pulse',
      title: 'h-5 w-32 bg-primary/15 rounded animate-pulse mb-2',
      subtitle: 'h-3 w-16 bg-primary/15 rounded animate-pulse',
      action: 'w-9 h-9 bg-primary/10 rounded-lg animate-pulse',
    },
    balance: {
      container: 'px-4 py-6',
      card: 'bg-card rounded-2xl p-6 border border-primary/20 shadow-xl space-y-4',
      header: 'flex items-center justify-between mb-4',
      label: 'h-3 w-20 bg-primary/15 rounded mb-2',
      value: 'h-8 w-32 bg-primary/15 rounded',
      avatar: 'w-14 h-14 bg-primary/10 rounded-full',
      statsGrid: 'grid grid-cols-3 gap-3 mt-6',
      statCard: 'bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-2',
      statRow: 'flex items-center gap-2 mb-1',
      statIcon: 'w-4 h-4 bg-primary/15 rounded',
      statLabel: 'h-2 w-12 bg-primary/15 rounded',
      statValue: 'h-5 w-8 bg-primary/15 rounded',
      inlineLabel: 'h-3 w-16 bg-primary/15 rounded',
      inlineValue: 'h-6 w-24 bg-primary/15 rounded',
      inlineStat: 'h-8 flex-1 bg-primary/10 rounded-lg animate-pulse',
    },
    list: {
      container: 'px-4',
      title: 'h-5 w-32 bg-primary/15 rounded animate-pulse mb-4',
      item: 'p-4 rounded-lg border border-primary/20 bg-card',
      row: 'flex items-center justify-between mb-3',
      left: 'flex items-center gap-3 flex-1',
      icon: 'w-10 h-10 bg-primary/10 rounded-lg',
      body: 'flex-1',
      line: 'h-4 w-24 bg-primary/15 rounded mb-2',
      subline: 'h-3 w-16 bg-primary/15 rounded',
      right: 'text-right',
      amount: 'h-4 w-20 bg-primary/15 rounded mb-1',
      amountSub: 'h-3 w-16 bg-primary/15 rounded',
      itemWrapper: 'w-full',
    },
    slider: {
      container: 'overflow-x-auto scrollbar-hide mb-4',
      item: 'shrink-0 border border-primary/20 bg-primary/10',
    },
    page: {
      container: 'min-h-screen bg-card pb-14',
    },
  },

  // ====================================
  // Accounts List
  // ====================================
  list: {
    cardWrapper: 'w-full',
  },

  // ====================================
  // Account Form Modal
  // ====================================
  formModal: {
    form: 'space-y-4',
    content: 'space-y-4',
    error: 'bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4',
    errorText: 'text-sm text-destructive font-medium',
    checkboxRow: 'flex items-center space-x-2 pt-2',
    checkboxLabel:
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  },
};
