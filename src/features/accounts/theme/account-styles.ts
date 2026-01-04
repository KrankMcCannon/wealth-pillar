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

import { accountComponents, accountSpacing, accountStatus } from './account-tokens';

export const accountStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `bg-[#F8FAFC] pb-32`, // Increased bottom padding to prevent overlap with bottom navigation
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    container: accountComponents.header.container,
    inner: accountComponents.header.inner,
    title: accountComponents.header.title,
    subtitle: accountComponents.header.subtitle,
    backButton: accountComponents.header.backButton,
    addButton: accountComponents.header.addButton,
    leftSection: 'flex items-center gap-3 flex-1',
    rightSection: 'flex items-center gap-2',
  },

  // ====================================
  // Balance Card styles
  // ====================================
  balanceCard: {
    container: `${accountSpacing.page.mobile} py-4`,
    card: accountComponents.balanceCard.container,
    mainRow: accountComponents.balanceCard.mainRow,
    balanceSection: accountComponents.balanceCard.balanceSection,
    header: accountComponents.balanceCard.header,
    iconContainer: accountComponents.balanceCard.icon,
    label: accountComponents.balanceCard.label,
    value: accountComponents.balanceCard.value,
    valuePositive: `${accountComponents.balanceCard.value} ${accountStatus.positive}`,
    valueNegative: `${accountComponents.balanceCard.value} ${accountStatus.negative}`,
    statsGrid: accountComponents.balanceCard.statsGrid,
    statItem: {
      primary: accountComponents.balanceCard.statItemPrimary,
      success: accountComponents.balanceCard.statItemSuccess,
      destructive: accountComponents.balanceCard.statItemDestructive,
      base: accountComponents.balanceCard.statItem,
    },
    statLabel: 'opacity-90 font-medium',
    statValue: 'ml-1 font-bold text-sm',
  },

  // ====================================
  // Accounts List styles
  // ====================================
  accountsList: {
    container: `${accountSpacing.page.mobile} pb-24`,
    header: accountComponents.accountsList.header,
    items: accountComponents.accountsList.container,
    addPrompt: accountComponents.accountsList.addPrompt,
    addPromptText: 'text-center',
    addPromptIcon: 'h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors',
    addPromptLabel: 'text-xs text-primary/70 group-hover:text-primary font-medium transition-colors',
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
    container: accountComponents.slider.container,
    inner: accountComponents.slider.inner,
    cardWrapper: accountComponents.slider.cardWrapper,
    addPlaceholder: accountComponents.slider.addPlaceholder,
    addPromptIcon: accountComponents.slider.addPromptIcon,
    addPromptLabel: accountComponents.slider.addPromptLabel,
  },

  // ====================================
  // Total Balance Link (Dashboard)
  // ====================================
  totalBalanceLink: {
    container: accountComponents.totalBalanceLink.container,
    leftSection: accountComponents.totalBalanceLink.leftSection,
    icon: accountComponents.totalBalanceLink.icon,
    label: accountComponents.totalBalanceLink.label,
    valuePositive: accountComponents.totalBalanceLink.valuePositive,
    valueNegative: accountComponents.totalBalanceLink.valueNegative,
    rightSection: accountComponents.totalBalanceLink.rightSection,
    badge: accountComponents.totalBalanceLink.badge,
    badgeText: accountComponents.totalBalanceLink.badgeText,
    arrow: accountComponents.totalBalanceLink.arrow,
  },
};
