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
import {
  radiusStyles,
  shadowStyles,
  typographyStyles,
  spacingStyles,
} from '@/features/budgets/theme/budget-styles';
import { stitchHome } from '@/styles/home-design-foundation';

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
      container: `bg-card/80 ${radiusStyles.lg} p-3 border border-border/60 ${shadowStyles.sm} relative overflow-hidden`,
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
      inner: 'flex items-center gap-2',
      cardWrapper: 'flex h-[4.125rem] w-max shrink-0 flex-col justify-center',
      addPlaceholder: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/20 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
      addPromptIcon:
        'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
      addPromptLabel: `${typographyStyles.xs} text-primary/70 group-hover:text-primary font-medium transition-colors`,
    },

    // Total Balance Link
    totalBalanceLink: {
      container: `${stitchHome.balanceLink} cursor-pointer`,
      leftSection: 'flex min-w-0 items-center gap-3',
      icon: stitchHome.balanceLinkIcon,
      label: stitchHome.balanceLinkLabel,
      valuePositive: stitchHome.balanceHero,
      valueNegative: stitchHome.balanceHeroNegative,
      rightSection: 'flex shrink-0 items-center gap-3',
      arrow: stitchHome.balanceLinkArrow,
      /** Dentro il riquadro saldi home: niente secondo bordo arrotondato, flush col contenitore. */
      embeddedContainer: `group -mx-3 -mb-3 flex w-[calc(100%+1.5rem)] items-center justify-between gap-2.5 rounded-b-2xl border-t border-border bg-muted/30 px-2.5 py-3.5 transition-colors hover:bg-muted/50 sm:-mx-3.5 sm:-mb-3.5 sm:w-[calc(100%+1.75rem)] sm:gap-4 sm:px-4 sm:py-4`,
      embeddedIcon: `flex size-12 shrink-0 items-center justify-center ${radiusStyles.lg} bg-primary/10 ring-1 ring-primary/15 sm:size-14`,
      embeddedBadge: `flex min-h-10 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 sm:min-h-11 sm:px-4`,
      embeddedValuePositive: `text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl`,
      embeddedValueNegative: `text-2xl font-bold tabular-nums tracking-tight text-destructive sm:text-3xl`,
      embeddedLabel: `${typographyStyles.xs} mb-1 font-semibold uppercase tracking-wide text-muted-foreground`,
      embeddedIconSvg: 'h-6 w-6 text-foreground sm:h-7 sm:w-7',
      embeddedArrow: 'h-6 w-6 shrink-0 text-muted-foreground',
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
    container: spacingStyles.page.mobile,
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
    container: accountTokens.components.slider.container,
    inner: accountTokens.components.slider.inner,
    cardWrapper: accountTokens.components.slider.cardWrapper,
    card: 'flex h-[4.125rem] w-max min-w-[8.75rem] shrink-0 flex-col justify-center rounded-lg border border-border/55 bg-card/80 px-2.5 py-0 shadow-sm backdrop-blur-[2px] overflow-hidden sm:min-w-[9rem] sm:px-3',
    addPlaceholder: accountTokens.components.slider.addPlaceholder,
    addPromptIcon: accountTokens.components.slider.addPromptIcon,
    addPromptLabel: accountTokens.components.slider.addPromptLabel,
    addPlaceholderContent: 'text-center',
    skeletonCard:
      'h-[4.125rem] w-[8.75rem] shrink-0 rounded-lg border border-border/50 bg-muted/40 animate-pulse sm:w-[9rem]',
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
    iconSvg: 'h-7 w-7 text-primary',
    label: accountTokens.components.totalBalanceLink.label,
    valuePositive: accountTokens.components.totalBalanceLink.valuePositive,
    valueNegative: accountTokens.components.totalBalanceLink.valueNegative,
    rightSection: accountTokens.components.totalBalanceLink.rightSection,
    arrow: accountTokens.components.totalBalanceLink.arrow,
    embeddedContainer: accountTokens.components.totalBalanceLink.embeddedContainer,
    embeddedIcon: accountTokens.components.totalBalanceLink.embeddedIcon,
    embeddedBadge: accountTokens.components.totalBalanceLink.embeddedBadge,
    embeddedValuePositive: accountTokens.components.totalBalanceLink.embeddedValuePositive,
    embeddedValueNegative: accountTokens.components.totalBalanceLink.embeddedValueNegative,
    embeddedLabel: accountTokens.components.totalBalanceLink.embeddedLabel,
    embeddedIconSvg: accountTokens.components.totalBalanceLink.embeddedIconSvg,
    embeddedArrow: accountTokens.components.totalBalanceLink.embeddedArrow,
  },
  // ====================================
  // Balance Section (Dashboard)
  // ====================================
  balanceSection: {
    container: stitchHome.balanceSection,
  },

  // ====================================
  // Accounts List
  // ====================================
  list: {
    cardWrapper: 'w-full',
  },
};
