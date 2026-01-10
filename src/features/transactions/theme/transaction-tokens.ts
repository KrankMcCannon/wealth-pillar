/**
 * Transaction Feature Design Tokens
 * Feature-specific tokens for transaction management
 *
 * Uses core design tokens from @/styles/core-tokens
 * Only defines truly transaction-specific patterns here
 */

import { coreTokens } from '@/styles/core-tokens';

export const transactionTokens = {
  // ============================================================================
  // TRANSACTION TYPE STYLES
  // Type-specific visual indicators (expense, income, transfer)
  // Feature-specific - these don't exist in core tokens
  // ============================================================================

  type: {
    expense: {
      icon: `bg-red-100 text-red-600`,
      badge: `bg-red-50 text-red-700`,
      text: coreTokens.color.destructive,
      color: 'from-red-500 to-red-600', // For gradients
    },
    income: {
      icon: `bg-green-100 text-green-600`,
      badge: `bg-green-50 text-green-700`,
      text: coreTokens.color.success,
      color: 'from-green-400 to-green-500', // For gradients
    },
    transfer: {
      icon: `bg-amber-100 text-amber-600`,
      badge: `bg-amber-50 text-amber-700`,
      text: coreTokens.color.warning,
      color: 'from-amber-400 to-amber-500', // For gradients
    },
  },

  // ============================================================================
  // SWIPE INTERACTION CONFIGURATION
  // Feature-specific swipe-to-delete parameters
  // ============================================================================

  interaction: {
    // Swipe-to-delete configuration
    swipe: {
      actionWidth: 88, // Width of delete button reveal area (px)
      threshold: 44, // Distance threshold to trigger open (px)
      velocityThreshold: -120, // Velocity threshold for quick swipes
    },

    // Spring animation parameters (for smooth swipe motion)
    spring: {
      stiffness: 450, // Snappier feel
      damping: 32, // Prevent overshoot
    },

    // Drag constraints
    drag: {
      elastic: 0.08, // Overshoot allowance
    },

    // Tap detection
    tap: {
      threshold: 10, // Max drag distance to count as tap (px)
    },
  },

  // ============================================================================
  // GROUPED CARD TOKENS
  // Feature-specific styling for grouped transaction cards
  // ============================================================================

  groupedCard: {
    // Spacing
    spacing: {
      cardPadding: 'py-0', // No vertical padding on card wrapper
      rowPadding: 'px-3 py-2', // Individual row padding
      rowGap: 'gap-3', // Gap between icon and content
      contentGap: 'gap-1.5', // Gap in metadata row
    },

    // Borders
    borders: {
      rowDivider: "divide-y divide-primary/20",
      lastRowNoBorder: 'last:border-0',
    },

    // Row states
    row: {
      base: `relative bg-[${coreTokens.color.card}] cursor-pointer transition-colors`,
      hover: 'active:bg-accent/5',
      deleteLayer:
        'absolute right-0 top-0 bottom-0 flex items-center justify-end',
    },

    // Icon styling
    icon: {
      container: `flex size-9 items-center justify-center ${coreTokens.radius.md} ${coreTokens.shadow.sm} transition-all ${coreTokens.animation.classes.transition} shrink-0`,
      hover: 'group-hover:scale-105',
    },

    // Text elements
    text: {
      title: 'font-semibold transition-colors truncate text-[15px] text-primary/90',
      metadata: `${coreTokens.typography.xs} text-primary/60 font-medium`,
      metadataSecondary: `${coreTokens.typography.xs} text-primary/50`,
      separator: `${coreTokens.typography.xs} text-primary/30`,
      amount: 'text-[15px] font-bold tracking-tight',
      amountSecondary: 'text-[10px] mt-0.5 font-medium opacity-70',
    },

    // Badge styling
    badge: {
      base: 'text-[10px] font-semibold px-1.5 py-0 border-primary/10',
    },

    // Delete button
    deleteButton: {
      base: `h-full px-4 font-semibold text-[${coreTokens.color.destructiveForeground}] flex items-center justify-center bg-[${coreTokens.color.destructive}]`,
      active: 'active:opacity-90',
    },
  },

  // ============================================================================
  // CARD VARIANTS
  // Regular vs recurrent transaction card styles
  // ============================================================================

  cardVariants: {
    regular: {
      card: `py-0 bg-[${coreTokens.color.card}] backdrop-blur-sm ${coreTokens.shadow.sm} hover:${coreTokens.shadow.md} transition-all duration-300 ${coreTokens.radius.lg} overflow-hidden`,
      header: 'bg-primary/5 px-4 py-2.5',
    },
    recurrent: {
      card: `py-0 bg-primary/5 backdrop-blur-sm ${coreTokens.shadow.md} hover:${coreTokens.shadow.lg} transition-all duration-300 ${coreTokens.radius.lg} overflow-hidden`,
      header: 'bg-primary/10 px-4 py-2.5',
    },
  },

  // ============================================================================
  // CONTEXT-BASED COLOR TOKENS
  // Urgency colors for due dates and recurrent transactions
  // ============================================================================

  contextColors: {
    // Due date urgency
    due: {
      urgent: 'bg-destructive/10 text-destructive', // <= 1 day
      warning: 'bg-warning/10 text-warning', // <= 3 days
      normal: 'bg-primary/10 text-primary', // > 3 days
    },

    // Badge colors for due context
    dueBadge: {
      urgent: 'border-destructive/30 text-destructive bg-destructive/10',
      warning: 'border-warning/30 text-warning bg-warning/10',
      normal: 'border-primary/20 text-primary bg-primary/10',
    },
  },

  // ============================================================================
  // COMPONENT-SPECIFIC PATTERNS
  // Header, user selector, tab navigation, day groups, modals, empty states
  // ============================================================================

  components: {
    // Header
    header: {
      title: coreTokens.typography.heading,
      button: `text-[${coreTokens.color.primary}] hover:bg-[${coreTokens.color.primary}] hover:text-[${coreTokens.color.primaryForeground}] ${coreTokens.radius.md} ${coreTokens.animation.classes.transition} p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center`,
    },

    // User Selector
    userSelector: {
      container: `sticky top-[60px] ${coreTokens.zIndex.classes.raised} bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2`,
    },

    // Tab Navigation
    tabNavigation: {
      container: 'flex gap-2 border-b border-primary/20 px-3 sm:px-4 py-2',
      tab: `px-4 py-2 ${coreTokens.typography.sm} font-medium rounded-t-lg`,
      tabActive: `text-[${coreTokens.color.primary}] border-b-2 border-[${coreTokens.color.primary}]`,
      tabInactive: `text-[${coreTokens.color.mutedForeground}] hover:text-[${coreTokens.color.foreground}]`,
    },

    // Day Group
    dayGroup: {
      header: 'flex items-center justify-between mb-2 px-1',
      title: coreTokens.typography.heading,
      stats: 'text-right',
      statsLabel: coreTokens.typography.sm,
      statsValue: `${coreTokens.typography.sm} font-bold`,
      statsValuePositive: `text-success`,
      statsValueNegative: `text-destructive`,
      count: `${coreTokens.typography.xs} mt-0.5`,
    },

    // Modal
    modal: {
      content: `bg-[${coreTokens.color.card}]`,
      title: `${coreTokens.typography.heading} text-[${coreTokens.color.foreground}]`,
      description: `${coreTokens.typography.sm} text-foreground/70`,
    },

    // Empty State
    emptyState: {
      container: 'text-center py-12',
      icon: `w-24 h-24 bg-primary/10 ${coreTokens.radius.full} flex items-center justify-center mb-4 mx-auto`,
      title: `${coreTokens.typography.lg} font-medium mb-2`,
      text: `${coreTokens.typography.sm} text-[${coreTokens.color.mutedForeground}]`,
    },
  },
} as const;
