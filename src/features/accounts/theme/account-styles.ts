/**
 * Account Feature Style Utilities
 * Reusable style combinations using design tokens
 *
 * Dashboard-only tokens (slider, total balance link, balance section).
 * Accounts page layout uses stitchHome / stitchRecurring from home-design-foundation.
 */

import type { CSSProperties } from 'react';
import { radiusStyles, typographyStyles } from '@/features/budgets/theme/budget-styles';
import { stitchHome } from '@/styles/home-design-foundation';

const accountTokens = {
  components: {
    slider: {
      container: 'overflow-x-auto scrollbar-hide flex items-center touch-pan-x touch-pan-y',
      inner: 'flex items-center gap-2',
      cardWrapper: 'flex h-[4.125rem] w-max shrink-0 flex-col justify-center',
      addPlaceholder: `flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/20 ${radiusStyles.sm} flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group`,
      addPromptIcon:
        'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
      addPromptLabel: `${typographyStyles.xs} text-primary/70 group-hover:text-primary font-medium transition-colors`,
    },

    totalBalanceLink: {
      container: `${stitchHome.balanceLink} cursor-pointer`,
      leftSection: 'flex min-w-0 items-center gap-3',
      icon: stitchHome.balanceLinkIcon,
      label: stitchHome.balanceLinkLabel,
      valuePositive: stitchHome.balanceHero,
      valueNegative: stitchHome.balanceHeroNegative,
      rightSection: 'flex shrink-0 items-center gap-3',
      arrow: stitchHome.balanceLinkArrow,
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

  status: {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  },
} as const;

export const accountStyles = {
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

  balanceSection: {
    container: stitchHome.balanceSection,
  },
};
