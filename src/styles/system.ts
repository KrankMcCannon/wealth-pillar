/**
 * Centralized Style System
 * Static Tailwind class registry for shared styling across the app.
 */

import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";
import type { Transaction } from "@/lib";

// ============================================================================
// CORE STYLE GROUPS
// Static Tailwind class strings for reusable layout/typography primitives.
// ============================================================================

export const typographyStyles = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  heading: "text-lg sm:text-xl font-bold tracking-tight",
  subheading: "text-base font-semibold",
  body: "text-sm",
  bodySmall: "text-xs",
  label: "text-xs font-medium",
  caption: "text-xs text-muted-foreground",
  amount: "text-lg sm:text-xl font-bold tracking-tight",
  amountLarge: "text-2xl sm:text-3xl font-bold tracking-tight",
} as const;

export const spacingStyles = {
  page: {
    mobile: "p-3",
    tablet: "sm:p-4",
    desktop: "md:p-6",
  },
  section: {
    mobile: "px-3 py-4",
    tablet: "sm:px-4 sm:py-6",
    desktop: "md:px-6 md:py-8",
  },
  card: {
    compact: "p-3",
    default: "p-4",
    comfortable: "p-6",
    large: "p-8",
  },
} as const;

export const radiusStyles = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
  raw: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
} as const;

export const shadowStyles = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
  card: "shadow-sm",
  elevated: "shadow-lg",
  modal: "shadow-xl",
} as const;

export const zIndexStyles = {
  classes: {
    raised: "z-10",
    dropdown: "z-20",
    sticky: "z-30",
    modal: "z-40",
    popover: "z-50",
    tooltip: "z-[60]",
  },
} as const;

export const animationStyles = {
  classes: {
    fast: "duration-150",
    normal: "duration-200",
    slow: "duration-300",
    transition: "transition-all duration-200",
    transitionFast: "transition-all duration-150",
    transitionSlow: "transition-all duration-300",
  },
} as const;

// ============================================================================
// LAYOUT PATTERNS
// Shared layout styles for headers, sections, lists, and footers.
// ============================================================================

export const layoutStyles = {
  section: {
    container: "space-y-4",
    headerRow: "flex items-center justify-between gap-3",
    title: "text-lg font-semibold text-primary",
    subtitle: "text-sm text-primary",
    actions: "flex items-center gap-2",
    surface: {
      plain: "bg-transparent",
      card: "bg-card border border-primary/15 rounded-2xl",
      muted: "bg-card/40 border border-border/60 rounded-2xl backdrop-blur-sm",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  list: {
    container: "space-y-3",
    divided: "divide-y divide-primary/10",
    item: "py-3 first:pt-0 last:pb-0",
  },
  footer: {
    base: "w-full flex items-center justify-between gap-3",
    static:
      "mt-auto px-4 py-3 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))]",
    sticky:
      "sticky bottom-0 bg-card/90 backdrop-blur border-t border-primary/15 px-4 py-3 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))]",
  },
} as const;

// ============================================================================
// FEATURE STYLE REGISTRY
// Consolidated feature-specific styles for settings and reports.
// ============================================================================

export const settingsStyles = {
  page: {
    container:
      "relative flex w-full min-h-[100dvh] flex-col bg-card",
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },
  header: {
    container:
      "sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/60 shadow-sm px-3 sm:px-4 py-2 sm:py-3",
    inner: "flex items-center justify-between",
    button:
      "text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 rounded-2xl transition-all duration-200 ease-out p-2 sm:p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm hover:shadow-md",
    title: "text-lg sm:text-xl font-bold tracking-tight text-primary",
    spacer: "min-w-[44px] min-h-[44px]",
  },
  main: {
    container: "px-3 sm:px-4 py-3 pb-20 space-y-5",
  },
  profile: {
    header:
      "flex items-center justify-between gap-3",
    container: "flex items-center gap-3 flex-1 min-w-0",
    avatar:
      "size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/30 shrink-0",
    info: "flex-1 min-w-0",
    name: "text-lg font-bold text-primary mb-1.5 truncate",
    badges: "flex items-center gap-1.5 flex-wrap",
    badge:
      "px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary whitespace-nowrap border border-primary/20",
    editButton:
      "hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-200 border border-primary/20 bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm hover:shadow-md whitespace-nowrap shrink-0",
  },
  profileDetails: {
    container: "divide-y divide-primary/20",
  },
  skeletons: {
    shimmer: "animate-pulse bg-primary/12",
    headerIcon: "w-10 h-10 rounded-xl",
    headerTitle: "w-24 h-6 rounded-lg",
    section: "space-y-4",
    sectionTitle: "h-6 rounded-lg bg-primary/15 animate-pulse",
    card: "bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden",
    cardHeader: "flex items-center gap-4 px-2 py-4 bg-card",
    avatar: "size-16 rounded-2xl bg-primary/12 shrink-0 animate-pulse",
    headerBody: "flex-1 space-y-2",
    headerLinePrimary: "h-6 w-24 bg-primary/15 rounded-lg animate-pulse",
    headerLineSecondary: "h-4 w-32 bg-primary/15 rounded-lg animate-pulse",
    dividerLight: "divide-y divide-primary/40",
    dividerStrong: "divide-y divide-primary/60",
    listRow: "flex items-center gap-3 p-3",
    listRowSpace: "flex items-center justify-between p-3",
    listIcon: "size-10 bg-primary/12 rounded-xl shrink-0 animate-pulse",
    listBody: "flex-1 space-y-1",
    listLineShort: "h-3 w-16 bg-primary/15 rounded animate-pulse",
    listLineMedium: "h-3 w-24 bg-primary/15 rounded animate-pulse",
    listLineLong: "h-3 w-32 bg-primary/15 rounded animate-pulse",
    listLineXL: "h-4 w-32 bg-primary/15 rounded animate-pulse",
    listLineXLLong: "h-3 w-40 bg-primary/15 rounded animate-pulse",
    memberRow: "p-3 flex items-center justify-between",
    memberLeft: "flex items-center gap-3 flex-1",
    memberIcon: "w-10 h-10 bg-primary/12 rounded-xl shrink-0 animate-pulse",
    memberBody: "flex-1 space-y-1",
    switchPill: "w-16 h-8 bg-primary/12 rounded-full shrink-0 animate-pulse",
    cardHeaderCompact: "px-4 py-3 bg-card space-y-2",
    headerLineSmall: "h-4 w-32 bg-primary/15 rounded animate-pulse",
    headerLineTiny: "h-3 w-24 bg-primary/15 rounded animate-pulse",
    cardStack: "space-y-4",
    cardMargin: "mb-4",
  },
  modals: {
    actionsButton: "w-full sm:w-auto",
    loadingIcon: "mr-2 h-4 w-4 animate-spin",
    iconSmall: "mr-2 h-4 w-4",
    form: "space-y-4",
    field: {
      label: "block text-sm font-medium text-primary mb-1.5",
      input:
        "w-full px-3 py-2 text-sm rounded-lg border border-primary/20 bg-card text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
      inputError: "border-destructive focus:ring-destructive/20 focus:border-destructive",
      errorText: "mt-1.5 text-sm text-destructive",
    },
    title: "text-lg font-semibold text-primary",
    description: "text-sm text-primary/70",
    invite: {
      infoBox: "rounded-lg bg-blue-50 border border-blue-200 p-3",
      infoText: "text-sm text-blue-800",
      infoStrong: "font-semibold",
    },
    preference: {
      list: "space-y-2",
      itemBase:
        "w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-start gap-3 hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
      itemActive: "border-primary/20 bg-primary/10",
      itemIdle: "border-primary/20 bg-card",
      radioBase:
        "mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
      radioActive: "border-primary/20 bg-primary",
      radioIdle: "border-primary/20 bg-card",
      radioIcon: "h-3 w-3 text-primary-foreground",
      content: "flex-1 min-w-0",
      titleRow: "flex items-center gap-2",
      title: "text-sm font-semibold",
      titleActive: "text-primary",
      titleIdle: "text-primary",
      currentBadge: "text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium",
      description: "text-sm text-primary/70 mt-0.5",
    },
    subscription: {
      container: "space-y-4",
      cardBase: "rounded-lg border-2 p-4 transition-all",
      cardActive: "border-primary/20 bg-primary/5",
      cardIdle: "border-primary/20 bg-card",
      headerRow: "flex items-start justify-between mb-3",
      planTitle: "text-lg font-bold text-primary",
      planPrice: "text-2xl font-bold text-primary mt-1",
      planPriceSuffix: "text-sm font-normal text-primary/60",
      planBadge:
        "px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold",
      list: "space-y-2",
      listItem: "flex items-start gap-2",
      listIcon: "h-4 w-4 text-green-600 mt-0.5 shrink-0",
      listText: "text-sm text-primary/70",
      premiumBadgeWrap: "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12",
      premiumBadge:
        "absolute transform rotate-45 bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs font-bold py-1 w-32 text-center shadow-md",
      premiumBadgeStyle: { top: "35px" },
      premiumTitleRow: "text-lg font-bold text-primary flex items-center gap-2",
      premiumIcon: "h-5 w-5 text-yellow-500",
      secureRow: "mt-4 pt-4 border-t border-primary/20",
      secureText: "text-xs text-primary/60 text-center",
      secureIcon: "inline h-3 w-3 mr-1",
      cancelButton: "text-red-600 hover:text-red-700 hover:bg-red-50",
    },
    deleteAccount: {
      overlay:
        "fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-6 sm:py-8",
      card: "w-full max-w-md rounded-2xl sm:rounded-3xl bg-card shadow-2xl p-6 sm:p-8 my-auto",
      header: "mb-6 flex items-start justify-between",
      headerLeft: "flex items-start gap-3 flex-1",
      headerContent: "flex-1",
      headerIconWrap:
        "h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0",
      headerIcon: "h-6 w-6",
      title: "text-xl sm:text-2xl font-semibold text-red-600",
      subtitle: "text-sm text-primary/70 mt-1",
      closeButton:
        "text-primary/80 hover:text-primary p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50",
      closeIcon: "h-5 w-5",
      body: "space-y-4 mb-6",
      bodyText: "text-sm text-primary",
      warningBox: "rounded-xl border-2 border-red-200 bg-red-50 p-4",
      warningTitle: "text-sm font-semibold text-red-900 mb-2",
      warningList: "space-y-2 text-sm text-red-700",
      warningItem: "flex items-start gap-2",
      warningDot: "text-red-500 mt-0.5",
      warningAlert:
        "rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-start gap-2",
      warningAlertIcon: "h-4 w-4 text-red-600 mt-0.5",
      button: "w-full sm:w-auto",
      confirmButton: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
  },
} as const;

export const reportsStyles = {
  page: {
    container: "relative flex w-full min-h-[100dvh] flex-col bg-card",
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },
  main: {
    container: "px-3 sm:px-4 py-4 pb-20 space-y-4 sm:space-y-6",
  },
  card: {
    container:
      "gap-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-primary/10 border border-primary/10 rounded-2xl overflow-hidden",
    divider: "divide-y divide-primary/10",
    dividerLine: "h-px bg-primary/10",
  },
  budgetPeriodCard: {
    container:
      "overflow-hidden border border-primary/20 shadow-sm hover:shadow-md transition-shadow",
    header:
      "w-full px-3 py-2.5 flex items-center gap-2 hover:bg-card/40 transition-colors",
    headerIcon:
      "flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0",
    headerIconSize: "h-4 w-4",
    headerContent: "flex-1 text-left min-w-0",
    headerTitleRow: "flex items-center gap-1.5 flex-wrap",
    headerTitle: "text-sm font-bold text-primary leading-tight",
    headerBadge: "text-xs border-primary/40 text-primary bg-primary/10",
    headerSubtitle: "text-xs text-muted-primary",
    headerChevronContainer: "flex items-center gap-1.5 shrink-0",
    headerChevron: "shrink-0 self-center",
    headerChevronIcon: "h-5 w-5 text-primary",
    headerDetailLabel: "text-[10px] text-primary hidden sm:block",
    metricsContainer: "px-3 pb-3 space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-1.5",
    metricCard: "p-2.5 rounded-lg border",
    metricCardAccount:
      "bg-card/40 border-primary/20",
    metricCardBudget:
      "bg-card/40 border-primary/20",
    metricCardTransfer:
      "bg-primary/10 border-primary/20",
    metricHeader: "flex items-center gap-1.5",
    metricIconBadge: "p-1 rounded-md shadow-sm shrink-0",
    metricIconBadgeDefault: "bg-card",
    metricIconBadgeTransfer: "bg-primary/15",
    metricIcon: "h-3.5 w-3.5",
    metricIconDefault: "text-primary",
    metricIconTransfer: "text-secondary",
    metricContent: "flex justify-between items-center gap-0.5 flex-1 min-w-0",
    metricLabel: "text-[10px] font-medium uppercase tracking-wider leading-none",
    metricLabelDefault: "text-primary",
    metricLabelTransfer: "text-secondary",
    metricValue: "text-lg font-bold leading-none",
    metricValuePositive: "text-emerald-600 dark:text-emerald-400",
    metricValueNegative: "text-red-600 dark:text-red-400",
    metricValueTransfer: "text-secondary",
    metricValuePrimary: "text-primary",
    metricValueIncome: "text-emerald-500",
    metricValueExpense: "text-red-500",
    metricValueWarning: "text-amber-500",
    transactionsContainer: "border-t border-primary/10",
    transactionsBody: "p-4 bg-card/50",
    transactionsTitle: "text-xs font-semibold text-primary mb-3",
    transactionsEmpty: "text-sm text-primary/50 text-center py-8",
    transactionsList: "divide-y divide-primary/10",
    transactionRow:
      "flex items-center gap-3 px-1.5 py-3 bg-card/60 transition-colors hover:bg-primary/5",
    transactionIconWrap: "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
    transactionIcon: "h-4 w-4",
    transactionBody: "flex-1 min-w-0",
    transactionTitle: "text-sm font-semibold text-primary truncate",
    transactionMetaRow: "flex items-center gap-2 mt-0.5",
    transactionMeta: "text-xs text-primary",
    transactionMetaSeparator: "text-xs text-primary/50",
    transactionAmount: "shrink-0",
  },
  budgetPeriodsSection: {
    loadingContainer: "space-y-3",
    loadingCard: "h-32 bg-card/50 rounded-2xl animate-pulse border border-primary/10",
    emptyContainer: "flex flex-col items-center justify-center py-12 px-4 text-center",
    emptyIconWrap: "flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4",
    emptyIcon: "h-8 w-8",
    emptyTitle: "text-lg font-semibold text-primary mb-2",
    emptyDescription: "text-sm text-primary max-w-sm",
    list: "space-y-3 sm:space-y-4",
  },
  annualCategory: {
    container: "space-y-3",
    card: "p-3",
    list: "space-y-2",
    item: "pb-3 border-b border-primary/15 last:border-b-0",
    row: "flex items-center justify-between text-sm",
    rowLeft: "flex items-center gap-2",
    iconWrap: "p-1 rounded-xl shrink-0",
    name: "font-medium text-primary",
    count: "text-xs text-muted-primary",
    amount: "font-semibold",
    bar: "h-1.5 w-full bg-card/30 rounded-full overflow-hidden",
    barFill: "h-full rounded-full transition-all duration-500 ease-out",
  },
  skeleton: {
    base: "animate-pulse bg-primary/10 rounded",
    text: "h-4 bg-primary/10 rounded w-3/4",
    card: "h-24 bg-primary/10 rounded-xl",
    line: "h-2 bg-primary/10 rounded w-full",
  },
} as const;

export function getAnnualCategoryIconStyle(color: string): CSSProperties {
  return { backgroundColor: `${color}20`, color };
}

export function getAnnualCategoryBarStyle(color: string, width: number): CSSProperties {
  return { width: `${width}%`, backgroundColor: color };
}

export function getBudgetPeriodTransactionIconStyle(color: string): CSSProperties {
  return {
    backgroundColor: `oklch(from ${color} calc(l + 0.35) c h / 0.15)`,
    color,
  };
}

// ============================================================================
// BUDGET FEATURE STYLES
// ============================================================================

export const budgetTokens = {
  status: {
    safe: {
      indicator: "bg-primary",
      text: "text-primary",
      message: "✅ Budget sotto controllo",
      color: "from-green-400 to-green-500",
    },
    warning: {
      indicator: "bg-warning",
      text: "text-warning",
      message: "⚠️ Attenzione, quasi esaurito",
      color: "from-amber-400 to-amber-500",
    },
    danger: {
      indicator: "bg-red-500",
      text: "text-destructive",
      message: "⚠️ Budget superato",
      color: "from-red-500 to-red-600",
    },
  },
  components: {
    header: {
      container: "px-3 sm:px-4 py-2.5",
      title: typographyStyles.heading,
      button: `text-primary hover:bg-primary hover:text-primary-foreground ${radiusStyles.md} ${animationStyles.classes.transition} p-2 min-w-10 min-h-10 flex items-center justify-center`,
    },
    card: {
      base: `bg-card/90 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 ${shadowStyles.lg} shadow-[0_12px_24px_oklch(var(--color-muted)/0.4)] ${radiusStyles.md} sm:${radiusStyles.lg} border border-primary/20`,
      compact: `bg-card/60 ${radiusStyles.md}`,
    },
    metrics: {
      container: "grid grid-cols-3 gap-2 sm:gap-3",
      item: `text-left p-2.5 bg-card/60 ${radiusStyles.sm} flex flex-col items-start gap-1`,
      label: `${typographyStyles.label}`,
      value: typographyStyles.amount,
    },
    progress: {
      container: `bg-card/60 ${radiusStyles.md} space-y-3`,
      bar: `w-full h-3 ${radiusStyles.full} bg-primary/10`,
      fill: `h-3 ${radiusStyles.full} transition-all duration-700 ease-out`,
    },
    button: {
      primary: `${typographyStyles.sm} font-semibold hover:bg-primary/10 ${radiusStyles.md} ${animationStyles.classes.transition} px-5 py-2.5 min-h-10 border border-primary/20 hover:border-primary/40 hover:${shadowStyles.sm}`,
    },
    dropdown: {
      content: `w-56 backdrop-blur-xl border border-border/50 ${shadowStyles.xl} ${radiusStyles.md} p-2 animate-in slide-in-from-top-2 duration-200`,
      item: `${typographyStyles.sm} font-medium text-primary hover:bg-primary hover:text-primary-foreground ${radiusStyles.sm} px-3 py-2.5 cursor-pointer transition-colors`,
    },
    select: {
      trigger: `w-full h-12 sm:h-14 bg-card border border-primary/20 ${shadowStyles.sm} ${radiusStyles.md} px-3 sm:px-4 hover:border-primary/40 focus:border-primary/20 focus:ring-2 focus:ring-primary/20 transition-all ${typographyStyles.sm} font-medium`,
      content: `bg-card/95 backdrop-blur-md border border-border/60 ${shadowStyles.xl} ${radiusStyles.md} min-w-[320px]`,
      item: `hover:bg-primary/10 ${radiusStyles.sm} px-3 sm:px-4 cursor-pointer font-medium group`,
    },
    transactionGroup: {
      header: "flex items-center justify-between mb-2 px-1",
      title: typographyStyles.heading,
      total: `${typographyStyles.sm} font-bold`,
    },
    chart: {
      container: "relative h-48 bg-card px-6 pb-8",
      labels: "relative px-1 mt-2 pb-2",
      label: `${typographyStyles.xs} font-medium tabular-nums`,
    },
    emptyState: {
      container: "text-center py-12",
      icon: `w-16 h-16 bg-primary/10 ${radiusStyles.lg} flex items-center justify-center mb-4 mx-auto`,
      title: `${typographyStyles.lg} font-semibold mb-2`,
      text: typographyStyles.sm,
    },
  },
} as const;

export type BudgetStatus = "safe" | "warning" | "danger";

export const budgetStyles = {
  page: {
    container: "relative flex w-full min-h-dvh flex-col bg-card",
    main: `flex-1 ${spacingStyles.page.mobile} ${spacingStyles.page.tablet} space-y-4 sm:space-y-6 pb-14`,
  },
  header: {
    container: budgetTokens.components.header.container,
    inner: "flex items-center justify-between",
    title: budgetTokens.components.header.title,
    button: budgetTokens.components.header.button,
  },
  userSelector: {
    container:
      "sticky top-12 z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-4 py-2",
    className: "bg-card border-border",
  },
  selectionSection: budgetTokens.components.card.base,
  selector: {
    wrapper: "mb-4",
    placeholder: "text-primary/50",
    trigger: budgetTokens.components.select.trigger,
    content: budgetTokens.components.select.content,
    item: `${budgetTokens.components.select.item} pl-7 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:bg-primary/15 data-[state=checked]:border data-[state=checked]:border-primary/25 data-[state=checked]:text-primary`,
    itemContent: "flex items-center gap-2.5 w-full",
    itemIcon:
      "flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/15 group-data-[state=checked]:bg-primary/20",
    itemIconContent:
      "text-primary group-hover:text-primary group-data-[state=checked]:text-primary",
    itemTextRow: "flex items-center gap-1.5 min-w-0",
    itemText: "text-sm sm:text-base font-semibold truncate group-hover:text-primary",
    itemChip:
      "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap group-hover:bg-primary/15 group-hover:text-primary group-data-[state=checked]:bg-primary/20 group-data-[state=checked]:text-primary",
    itemSubtext: "text-xs shrink-0 group-hover:text-primary",
  },
  budgetDisplay: {
    container: "bg-primary/10 rounded-xl p-3 sm:p-4 relative",
    actionsMenu: "absolute top-2 right-2",
    actionsButton: "h-8 w-8 p-0 hover:bg-primary/20 rounded-lg transition-colors",
    actionIcon: "h-4 w-4",
    headerRow:
      "flex flex-col gap-3 mb-3 pr-10 sm:flex-row sm:items-center sm:justify-between",
    headerContent: "flex items-center gap-3 flex-1 min-w-0",
    iconContainer:
      "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 shadow-sm shrink-0",
    iconText: "flex-1 min-w-0",
    iconClass: "text-primary h-4 w-4",
    budgetName: "text-base text-primary sm:text-lg font-bold leading-tight truncate",
    budgetStatus: "text-xs font-medium text-primary/70",
    periodContainer: "text-left sm:text-right shrink-0",
    periodLabel: "text-[10px] font-semibold uppercase tracking-wide text-primary pl-1",
    periodValue: "text-xs font-medium whitespace-nowrap text-primary pl-1",
  },
  metrics: {
    container: budgetTokens.components.metrics.container,
    item: budgetTokens.components.metrics.item,
    label: budgetTokens.components.metrics.label,
    value: budgetTokens.components.metrics.value,
    labelDestructive: `${budgetTokens.components.metrics.label} text-destructive`,
    valueSafe: "text-primary",
    valueDanger: "text-destructive",
    fallbackGrid: "grid grid-cols-2 gap-4",
  },
  progress: {
    container: budgetTokens.components.progress.container,
    header: "flex justify-between items-center",
    indicatorRow: "flex items-center gap-2",
    indicator: "w-2 h-2 rounded-full",
    indicatorSafe: "bg-primary",
    indicatorWarning: "bg-warning",
    indicatorDanger: "bg-red-500",
    label: "text-sm text-primary font-semibold",
    percentage: "text-xl font-bold",
    percentageSafe: "text-primary",
    percentageWarning: "text-warning",
    percentageDanger: "text-destructive",
    barWrapper: "relative",
    barContainer: budgetTokens.components.progress.bar,
    barFill: budgetTokens.components.progress.fill,
    barFillBase: "h-full rounded-full transition-all duration-500",
    barFillSafe: "bg-linear-to-r from-green-400 to-green-500",
    barFillWarning: "bg-linear-to-r from-amber-400 to-amber-500",
    barFillDanger: "bg-linear-to-r from-red-500 to-red-600",
    status: "text-center text-primary",
    statusText: "text-xs",
  },
  chart: {
    card: "p-0 bg-card shadow-sm rounded-2xl border border-primary/20 overflow-hidden",
    header: "px-6 pt-5 pb-2 flex items-start justify-between",
    headerLabel: "text-xs mb-1",
    headerAmount: "text-2xl font-bold",
    comparisonContainer: "px-3 py-1.5 rounded-lg",
    comparisonNegative: "bg-destructive/10",
    comparisonPositive: "bg-success/10",
    comparisonText: "text-sm font-semibold",
    comparisonTextNegative: "text-destructive",
    comparisonTextPositive: "text-primary",
    svgContainer: budgetTokens.components.chart.container,
    svg: "w-full h-full",
    dayLabels: budgetTokens.components.chart.labels,
    dayLabel: budgetTokens.components.chart.label,
    dayRow: "flex justify-between relative",
    dayLabelVisible: "text-primary/70",
    dayLabelHidden: "text-transparent",
    dayLabelPosition: "absolute",
  },
  transactions: {
    container: "space-y-6",
    dayGroup: undefined,
    dayHeader: budgetTokens.components.transactionGroup.header,
    dayTitle: budgetTokens.components.transactionGroup.title,
    dayStats: "text-right",
    dayStatsTotal: "flex items-center gap-2 justify-end",
    dayStatsTotalLabel: "text-sm",
    dayStatsTotalValue: budgetTokens.components.transactionGroup.total,
    dayStatsTotalValueNegative: "text-destructive",
    dayStatsTotalValuePositive: "text-primary",
    dayStatsCount: "text-xs mt-0.5",
    emptyMessage: "text-center py-8",
    seeAllButton: budgetTokens.components.button.primary,
    seeAllButtonContainer: "flex justify-center mt-6",
  },
  emptyState: {
    container: budgetTokens.components.emptyState.container,
    icon: budgetTokens.components.emptyState.icon,
    iconContent: "w-8 h-8 text-primary",
    title: budgetTokens.components.emptyState.title,
    text: budgetTokens.components.emptyState.text,
  },
  dropdownMenu: {
    content: budgetTokens.components.dropdown.content,
    item: budgetTokens.components.dropdown.item,
    contentWide:
      "w-48 bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2",
    itemBase: "text-sm font-medium rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
    itemEdit: "hover:bg-primary/8 hover:text-primary",
    itemDelete: "text-destructive hover:bg-destructive/10 hover:text-destructive",
    itemWithIcon: "flex items-center",
    itemIcon: "mr-2",
  },
  skeleton: {
    base: "animate-pulse",
    card: "bg-card rounded-xl p-4 sm:p-6",
    line: "h-4 bg-primary/15 rounded",
    lineShort: "w-1/3 h-4 bg-primary/15 rounded",
    lineMedium: "w-2/3 h-4 bg-primary/15 rounded",
    circle: "rounded-full bg-primary/12",
    rect: "rounded bg-primary/12",
    budgetCard: "p-4 rounded-xl border border-primary/20 bg-card",
    budgetCardRow: "flex items-center gap-3 mb-3",
    budgetCardIcon: "w-10 h-10 bg-primary/10 rounded-xl",
    budgetCardBody: "flex-1",
    budgetCardTitle: "h-4 bg-primary/15 rounded w-2/3 mb-2",
    budgetCardMetaRow: "flex items-center gap-2",
    budgetCardDot: "w-2 h-2 bg-primary/25 rounded-full",
    budgetCardMeta: "h-3 bg-primary/15 rounded w-8",
    budgetCardRight: "text-right",
    budgetCardAmount: "h-4 bg-primary/15 rounded w-16 mb-1",
    budgetCardSubAmount: "h-3 bg-primary/15 rounded w-12",
    budgetCardBar: "w-full h-2 bg-primary/12 rounded-full",
    detailsCard: "p-6 rounded-xl border border-primary/20 bg-card space-y-4",
    detailsHeader: "flex items-center justify-between",
    detailsLeft: "text-left",
    detailsTitle: "h-6 bg-primary/15 rounded w-32 mb-2",
    detailsSubtitle: "h-4 bg-primary/15 rounded w-24",
    detailsRight: "text-right",
    detailsAmount: "h-8 bg-primary/15 rounded w-20 mb-1",
    detailsAmountSub: "h-3 bg-primary/15 rounded w-16",
    detailsBar: "w-full h-3 bg-primary/12 rounded-full",
    detailsStats: "grid grid-cols-2 gap-4 pt-4 border-t border-primary/20",
    detailsStatLabel: "h-3 bg-primary/15 rounded w-16 mb-1",
    detailsStatValue: "h-5 bg-primary/15 rounded w-20",
    txCard: "p-3 rounded-lg border border-primary/20 bg-card",
    txRow: "flex items-center gap-3",
    txIcon: "w-8 h-8 bg-primary/10 rounded-lg",
    txBody: "flex-1",
    txTitle: "h-4 bg-primary/15 rounded w-3/4 mb-1",
    txMeta: "h-3 bg-primary/15 rounded w-1/2",
    txRight: "text-right",
    txAmount: "h-4 bg-primary/15 rounded w-16 mb-1",
    txAmountSub: "h-3 bg-primary/15 rounded w-12",
    page: "flex flex-col min-h-screen bg-card",
    pageHeader:
      "sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm",
    pageHeaderRow: "flex items-center justify-between",
    pageHeaderLeft: "flex items-center gap-3",
    pageHeaderIcon: "w-8 h-8 bg-primary/12 rounded-xl animate-pulse",
    pageHeaderText: "h-5 bg-primary/15 rounded w-16 mb-1 animate-pulse",
    pageHeaderSubtext: "h-3 bg-primary/15 rounded w-20 animate-pulse",
    pageHeaderAction: "w-8 h-8 bg-primary/12 rounded-xl animate-pulse",
    selectorSection: "bg-card/80 backdrop-blur-xl py-3 border-b border-primary/20 shadow-sm",
    selectorList: "flex items-center gap-2 pl-4",
    selectorListStyle: { height: 44 },
    selectorItem:
      "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 animate-pulse",
    selectorIcon: "w-5 h-5 bg-primary/25 rounded-full",
    selectorText: "w-12 h-3 bg-primary/20 rounded",
    pageMain: "flex-1 p-4 pb-20",
    pageMainBody: "space-y-6",
    pageSectionTitle: "h-6 bg-primary/15 rounded w-32 mb-2 animate-pulse",
    pageSectionSubtitle: "h-4 bg-primary/15 rounded w-24 animate-pulse",
    pageDetails: "space-y-4",
    pageDetailsActions: "flex gap-2",
    pageDetailsAction: "h-10 bg-primary/12 rounded-lg flex-1 animate-pulse",
  },
  loading: {
    header: "sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3",
    title: "h-6 w-32 bg-card/60 rounded animate-pulse",
    content: "space-y-6 px-4 py-6",
    details: "space-y-4",
  },
  section: {
    container: "bg-card",
    emptyContainer: "bg-card rounded-2xl p-8 text-center border border-primary/20 shadow-sm",
    emptyIconWrap:
      "flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 mx-auto mb-4 shadow-sm",
    emptyIconInner:
      "w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center",
    emptyIconText: "text-primary font-bold text-lg",
    emptyTitle: "font-semibold text-primary mb-2",
    emptyDescription: "text-sm text-muted-foreground mb-4 max-w-sm mx-auto",
    emptyButton:
      "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105",
    groupCard: "bg-card shadow-sm border border-primary/20 rounded-xl overflow-hidden",
    groupHeader: "bg-card p-3 border-b border-primary/20",
    groupRow: "flex items-center justify-between mb-2",
    groupLeft: "flex items-center gap-2",
    avatar:
      "flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-primary/5 shadow-sm",
    avatarText: "text-md font-bold text-primary",
    groupText: "text-sm font-semibold",
    periodText: "text-xs",
    amount: "text-sm font-bold",
    amountDivider: "text-primary/50 font-normal",
    progressRow: "flex items-center gap-2",
    progressBadge: "flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10",
    progressBadgeDot: "w-1.5 h-1.5 rounded-full",
    progressBadgeText: "text-xs font-bold",
    cardsDivider: "divide-y divide-primary/10",
    cardSkeleton: "px-3 py-2 animate-pulse",
    cardSkeletonRow: "flex items-center gap-3",
    cardSkeletonIcon: "w-11 h-11 bg-primary/10 rounded-2xl",
    cardSkeletonBody: "flex-1",
    cardSkeletonTitle: "h-4 bg-primary/15 rounded w-24 mb-1",
    cardSkeletonSubtitle: "h-3 bg-primary/15 rounded w-16",
    cardSkeletonRight: "text-right",
    cardSkeletonAmount: "h-4 bg-primary/15 rounded w-20 mb-1",
    cardSkeletonSubAmount: "h-3 bg-primary/15 rounded w-12",
  },
  periodManager: {
    error:
      "px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md",
    body: "space-y-4",
    userCard: "rounded-xl p-3 border border-primary/10 bg-card",
    userRow: "flex items-center gap-2",
    userIconWrap: "p-1.5 bg-primary/10 rounded-lg",
    userIcon: "h-4 w-4 text-primary",
    userName: "text-sm font-bold text-primary",
    periodCard: "bg-card rounded-xl p-4 border border-primary/10 shadow-sm",
    periodHeader: "flex items-center gap-2 mb-3",
    periodTitle: "text-base font-bold text-primary",
    periodContent: "space-y-3",
    periodRow: "flex flex-col sm:flex-row sm:items-center justify-between gap-2",
    periodDate: "text-sm font-medium text-primary",
    periodBadge: "bg-card text-primary border border-border shadow-sm self-start sm:self-auto",
    periodBadgeIcon: "h-3 w-3 mr-1",
    metricsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    metricCardSpent: "rounded-lg p-3 border border-destructive/20 bg-destructive/5",
    metricCardSaved: "rounded-lg p-3 border border-primary/20 bg-primary/5",
    metricRow: "flex items-center gap-1.5 mb-1",
    metricIconSpent: "h-3 w-3 text-destructive",
    metricIconSaved: "h-3 w-3 text-primary",
    metricLabelSpent: "text-xs font-bold text-destructive uppercase tracking-wide",
    metricLabelSaved: "text-xs font-bold text-primary uppercase tracking-wide",
    metricValueSpent: "text-base sm:text-lg font-bold text-destructive",
    metricValueSaved: "text-base sm:text-lg font-bold text-primary",
    dateFieldWrap: "space-y-2 overflow-hidden",
    alertText: "text-primary font-medium",
  },
  periodCard: {
    container:
      "p-4 border border-primary/10 rounded-xl space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow",
    header: "flex justify-between items-start gap-3",
    headerContent: "flex-1",
    title: "text-sm font-medium text-primary",
    arrow: "text-primary mx-1",
    badge: "mt-1",
    badgeActive: "bg-primary text-primary mt-1",
    deleteButton: "h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
    deleteIcon: "h-4 w-4",
    metricsGrid: "grid grid-cols-2 gap-2",
    metricSpent: "p-3 bg-destructive/5 rounded-lg border border-destructive/20",
    metricSaved: "p-3 bg-primary/5 rounded-lg border border-primary/20",
    metricLabelSpent: "text-xs font-bold text-destructive uppercase tracking-wide mb-1",
    metricLabelSaved: "text-xs font-bold text-primary uppercase tracking-wide mb-1",
    metricValueSpent: "text-base font-bold text-destructive",
    metricValueSaved: "text-base font-bold text-primary",
    categorySection: "pt-2 border-t border-primary/10",
    categoryTitle: "text-xs font-bold text-primary uppercase tracking-wide mb-2",
    categoryList: "space-y-1.5",
    categoryRow: "flex justify-between items-center text-sm",
    categoryLabel: "text-primary capitalize",
    categoryAmount: "font-medium text-primary",
  },
  periodInfo: {
    emptyText: "text-xs text-primary/70",
    headerRow: "flex items-center justify-between gap-2",
    headerLeft: "flex items-center gap-2",
    headerIcon: "h-3 w-3 text-primary/70",
    headerText: "text-xs font-medium text-primary/70",
    badge: "text-xs font-semibold",
    badgeIcon: "h-3 w-3 mr-1",
    metricsGrid: "grid grid-cols-2 gap-3",
    metricSpent: "bg-primary/5 rounded-lg px-3 py-2 border border-primary/10",
    metricSaved: "bg-success/5 rounded-lg px-3 py-2 border border-success/10",
    metricLabelSpent: "text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1",
    metricLabelSaved: "text-xs font-semibold text-success/70 uppercase tracking-wide mb-1",
    metricValueSpent: "text-sm font-bold text-destructive",
    metricValueSaved: "text-sm font-bold text-success",
    topCategories: "pt-2 border-t border-primary/10",
    topCategoriesTitle: "text-xs font-semibold text-primary/70 uppercase tracking-wide mb-2",
    topCategoriesList: "space-y-1",
    topCategoryRow: "flex items-center justify-between",
    topCategoryLabel: "text-xs text-primary/70 capitalize",
    topCategoryAmount: "text-xs font-semibold text-primary",
  },
  periodsList: {
    container: "space-y-6",
    sectionTitle: "text-lg font-bold text-primary mb-3",
    sectionList: "space-y-3",
    emptyContainer: "text-center py-12",
    emptyTitle: "text-primary text-base",
    emptySubtitle: "text-sm text-primary mt-2",
    deletingToast:
      "fixed bottom-4 right-4 bg-card text-primary px-4 py-2 rounded-lg shadow-lg",
    deletingText: "text-sm font-medium",
  },
  loadingSkeletons: {
    header: "mb-4",
    headerBody: "flex-1",
    headerAction: "shrink-0",
    row: "flex items-center gap-2",
    emptyState: "text-center",
    section: "animate-pulse",
    chartHeader: "px-6 pt-5 pb-2 flex items-start justify-between",
    chartFooter: "px-6 pb-4 flex justify-between gap-4",
    list: "space-y-4 sm:space-y-6",
    selectorTitle: "mb-2 h-6",
    selectorSubtitle: "h-4",
    selectorBox: "h-14 rounded-xl",
    budgetCardText: "flex-1",
    budgetCardTitle: "h-5 mb-2",
    budgetCardSubtitle: "h-3",
    budgetCardPeriod: "shrink-0",
    budgetCardPeriodLine: "h-3 mb-2",
    budgetCardPeriodValue: "h-4 w-24",
    progressIndicatorRow: "flex items-center gap-2",
    progressIndicator: "w-2 h-2 rounded-full",
    progressValue: "h-5",
    progressStatus: "text-center",
    progressStatusLine: "h-3 w-1/2 mx-auto",
    chartCard: "p-0 rounded-2xl border border-primary/20 overflow-hidden",
    chartWrap: "relative",
    chartArea: "w-full h-32 rounded",
  },
  formModal: {
    form: "space-y-2",
    content: "gap-2",
    error:
      "px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md",
    section: "gap-2",
    sectionTight: "gap-1 shrink-0",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    categoryField: "space-y-1",
    categoryBox: "space-y-3 rounded-2xl border border-primary/15 bg-card/70 p-3",
    categoryHeader: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
    categorySelect: "h-9 text-sm",
    categoryMeta: "flex items-center gap-3 text-xs text-muted-foreground",
    categoryMetaStrong: "font-medium",
    categoryLink: "text-primary hover:underline disabled:opacity-40",
    categoryList: "max-h-60 overflow-y-auto space-y-2 pr-1",
    categoryEmpty: "text-sm text-muted-foreground px-1 py-4",
    categoryItem:
      "flex items-center gap-3 rounded-xl border border-primary/10 bg-card/80 px-3 py-2 text-sm hover:border-primary/40 cursor-pointer",
    categoryItemRow: "flex items-center gap-2",
    categoryDot: "h-2.5 w-2.5 rounded-full",
  },
  statusBadge: {
    safe: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  },
} as const;

export function getStatusStyles(status: BudgetStatus) {
  return budgetTokens.status[status];
}

export function getMetricsItemStyles(isNegative?: boolean) {
  return {
    container: budgetStyles.metrics.item,
    label: budgetStyles.metrics.label,
    value: `${budgetStyles.metrics.value} ${isNegative ? budgetStyles.metrics.valueDanger : budgetStyles.metrics.valueSafe}`,
  };
}

export function getProgressIndicatorStyles(status: BudgetStatus) {
  const baseStyles = budgetStyles.progress.indicator;
  const statusStyles = {
    safe: budgetStyles.progress.indicatorSafe,
    warning: budgetStyles.progress.indicatorWarning,
    danger: budgetStyles.progress.indicatorDanger,
  };
  return `${baseStyles} ${statusStyles[status]}`;
}

export function getProgressBarFillStyles(status: BudgetStatus, percentage: number) {
  const baseStyles = budgetStyles.progress.barFill;
  const statusStyles = {
    safe: budgetStyles.progress.barFillSafe,
    warning: budgetStyles.progress.barFillWarning,
    danger: budgetStyles.progress.barFillDanger,
  };
  return {
    className: `${baseStyles} ${statusStyles[status]}`,
    style: { width: `${Math.min(percentage, 100)}%` },
  };
}

export function getBudgetCategoryColorStyle(color?: string) {
  return { backgroundColor: color || "#CBD5F5" };
}

export function getBudgetSectionProgressStyles(percentage: number): {
  amount: string;
  dot: string;
  text: string;
  bar: string;
} {
  if (percentage > 100) {
    return {
      amount: "text-destructive",
      dot: "bg-destructive",
      text: "text-destructive",
      bar: "bg-destructive",
    };
  }
  if (percentage > 75) {
    return {
      amount: "text-warning",
      dot: "bg-warning",
      text: "text-warning",
      bar: "bg-warning",
    };
  }
  return {
    amount: "text-primary",
    dot: "bg-primary",
    text: "text-primary",
    bar: "bg-primary",
  };
}

export function getBudgetGroupCardStyle(index: number) {
  return { animationDelay: `${index * 150}ms` };
}

export function getBudgetSectionProgressBarStyle(percentage: number) {
  return { width: `${Math.min(percentage, 100)}%` };
}

export function getChartGradientStartStyle() {
  return { stopColor: "#7578EC", stopOpacity: 0.08 };
}

export function getChartGradientEndStyle() {
  return { stopColor: "#7578EC", stopOpacity: 0 };
}

export function getChartDayRowStyle() {
  return { width: "100%" };
}

export function getChartDayLabelStyle(position: number) {
  return {
    left: `${position}%`,
    transform: "translateX(-50%)",
    fontVariantNumeric: "tabular-nums",
  };
}

export function getComparisonStyles(isHigher: boolean) {
  return {
    container: `${budgetStyles.chart.comparisonContainer} ${isHigher ? budgetStyles.chart.comparisonNegative : budgetStyles.chart.comparisonPositive}`,
    text: `${budgetStyles.chart.comparisonText} ${isHigher ? budgetStyles.chart.comparisonTextNegative : budgetStyles.chart.comparisonTextPositive}`,
  };
}

// ============================================================================
// TRANSACTIONS FEATURE STYLES
// ============================================================================

export const transactionTokens = {
  type: {
    expense: {
      icon: "bg-red-100 text-red-600",
      badge: "bg-red-50 text-red-700",
      text: "text-destructive",
      color: "from-red-500 to-red-600",
    },
    income: {
      icon: "bg-green-100 text-green-600",
      badge: "bg-green-50 text-green-700",
      text: "text-success",
      color: "from-green-400 to-green-500",
    },
    transfer: {
      icon: "bg-amber-100 text-amber-600",
      badge: "bg-amber-50 text-amber-700",
      text: "text-warning",
      color: "from-amber-400 to-amber-500",
    },
  },
  interaction: {
    swipe: {
      actionWidth: 88,
      threshold: 44,
      velocityThreshold: -120,
    },
    spring: {
      stiffness: 450,
      damping: 32,
    },
    drag: {
      elastic: 0.08,
    },
    tap: {
      threshold: 10,
    },
  },
  groupedCard: {
    spacing: {
      cardPadding: "py-0",
      rowPadding: "p-3",
      rowGap: "gap-3",
      contentGap: "gap-1.5",
    },
    borders: {
      rowDivider: "divide-y divide-primary/20",
      lastRowNoBorder: "last:border-0",
    },
    row: {
      base: "relative bg-card cursor-pointer transition-colors",
      hover: "active:bg-accent/5",
      deleteLayer: "absolute right-0 top-0 bottom-0 flex items-center justify-end",
    },
    icon: {
      container: `flex size-9 items-center justify-center ${radiusStyles.md} ${shadowStyles.sm} transition-all ${animationStyles.classes.transition} shrink-0`,
      hover: "group-hover:scale-105",
    },
    text: {
      title: "font-semibold transition-colors truncate text-[15px] text-primary/90",
      metadata: `${typographyStyles.xs} text-primary/60 font-medium`,
      metadataSecondary: `${typographyStyles.xs} text-primary/50`,
      separator: `${typographyStyles.xs} text-primary/30`,
      amount: "text-[15px] font-bold tracking-tight",
      amountSecondary: "text-[10px] mt-0.5 font-medium opacity-70",
    },
    badge: {
      base: "text-[10px] font-semibold px-1.5 py-0 border-primary/10",
    },
    deleteButton: {
      base: "h-full px-4 font-semibold text-destructive-foreground flex items-center justify-center bg-destructive",
      active: "active:opacity-90",
    },
  },
  cardVariants: {
    regular: {
      card: `py-0 bg-card backdrop-blur-sm ${shadowStyles.sm} hover:${shadowStyles.md} transition-all duration-300 ${radiusStyles.lg} overflow-hidden`,
      header: "bg-primary/5 px-4 py-2.5",
    },
    recurrent: {
      card: `py-0 bg-primary/5 backdrop-blur-sm ${shadowStyles.md} hover:${shadowStyles.lg} transition-all duration-300 ${radiusStyles.lg} overflow-hidden`,
      header: "bg-primary/10 px-4 py-2.5",
    },
  },
  contextColors: {
    due: {
      urgent: "bg-destructive/10 text-destructive",
      warning: "bg-warning/10 text-warning",
      normal: "bg-primary/10 text-primary",
    },
    dueBadge: {
      urgent: "border-destructive/30 text-destructive bg-destructive/10",
      warning: "border-warning/30 text-warning bg-warning/10",
      normal: "border-primary/20 text-primary bg-primary/10",
    },
  },
  components: {
    header: {
      title: typographyStyles.heading,
      button: `text-primary hover:bg-primary hover:text-primary-foreground ${radiusStyles.md} ${animationStyles.classes.transition} p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center`,
    },
    userSelector: {
      container: `sticky top-[60px] ${zIndexStyles.classes.raised} bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2`,
    },
    tabNavigation: {
      container: "flex gap-2 border-b border-primary/20 px-3 sm:px-4 py-2",
      tab: `px-4 py-2 ${typographyStyles.sm} font-medium rounded-t-lg`,
      tabActive: "text-primary border-b-2 border-primary",
      tabInactive: "text-muted-foreground hover:text-foreground",
    },
    dayGroup: {
      header: "flex items-center justify-between mb-2 px-1",
      title: `${typographyStyles.heading} text-primary`,
      stats: "text-right",
      statsLabel: `${typographyStyles.sm} text-primary`,
      statsValue: `${typographyStyles.sm} font-bold`,
      statsValuePositive: "text-success",
      statsValueNegative: "text-destructive",
      count: `${typographyStyles.xs} mt-0.5 text-primary`,
    },
    modal: {
      content: "bg-card",
      title: `${typographyStyles.heading} text-primary`,
      description: `${typographyStyles.sm} text-primary/70`,
    },
    emptyState: {
      container: "text-center py-12",
      icon: `w-24 h-24 bg-primary/10 ${radiusStyles.full} flex items-center justify-center mb-4 mx-auto`,
      title: `${typographyStyles.lg} font-medium mb-2`,
      text: `${typographyStyles.sm} text-primary`,
    },
  },
} as const;

export const transactionStyles = {
  page: {
    container: "relative flex w-full min-h-[100dvh] flex-col bg-card",
    main: `flex-1 ${spacingStyles.page.mobile} space-y-4 sm:space-y-6 pb-14`,
    loadingContent: "space-y-6",
  },
  header: {
    inner: "flex items-center justify-between",
    title: transactionTokens.components.header.title,
    button: transactionTokens.components.header.button,
  },
  userSelector: {
    container: transactionTokens.components.userSelector.container,
    className: "bg-card border-border",
  },
  tabNavigation: {
    container: transactionTokens.components.tabNavigation.container,
    tab: transactionTokens.components.tabNavigation.tab,
    tabActive: transactionTokens.components.tabNavigation.tabActive,
    tabInactive: transactionTokens.components.tabNavigation.tabInactive,
    wrapper: "px-3",
  },
  recurringSection: {
    container: "bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30",
  },
  dayGroup: {
    header: transactionTokens.components.dayGroup.header,
    title: transactionTokens.components.dayGroup.title,
    stats: transactionTokens.components.dayGroup.stats,
    statsTotal: "flex items-center gap-2 justify-end",
    statsTotalLabel: transactionTokens.components.dayGroup.statsLabel,
    statsTotalValue: transactionTokens.components.dayGroup.statsValue,
    statsTotalValuePositive: transactionTokens.components.dayGroup.statsValuePositive,
    statsTotalValueNegative: transactionTokens.components.dayGroup.statsValueNegative,
    statsCount: transactionTokens.components.dayGroup.count,
  },
  emptyState: {
    container: transactionTokens.components.emptyState.container,
    icon: transactionTokens.components.emptyState.icon,
    title: transactionTokens.components.emptyState.title,
    text: transactionTokens.components.emptyState.text,
  },
  modal: {
    content: transactionTokens.components.modal.content,
    title: transactionTokens.components.modal.title,
    description: transactionTokens.components.modal.description,
  },
  form: {
    container: "space-y-4",
    error: "bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4",
    errorText: "text-sm text-destructive font-medium",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  },
  skeleton: {
    base: "animate-pulse",
    card: "bg-card rounded-lg p-3",
    line: "h-4 bg-primary/15 rounded",
    lineShort: "w-1/3 h-4 bg-primary/15 rounded",
    lineMedium: "w-2/3 h-4 bg-primary/15 rounded",
    circle: "w-10 h-10 rounded-lg bg-primary/12",
    rect: "rounded bg-primary/12",
    title: "h-6 w-32 bg-card/60 rounded animate-pulse",
  },
  skeletons: {
    header:
      "sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm",
    headerRow: "flex items-center justify-between",
    headerIcon: "w-10 h-10 bg-primary/12 rounded-xl",
    headerTitle: "h-6 bg-primary/15 rounded w-24",
    userSelector:
      "sticky top-[60px] z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2",
    userSelectorListSpacing: "flex items-center gap-2",
    userSelectorChip: "shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10",
    userSelectorDot: "w-5 h-5 bg-primary/25 rounded-full",
    userSelectorText: "w-12 h-3 bg-primary/20 rounded",
    userSelectorListStyle: { height: 44 } satisfies CSSProperties,
    card: "p-3 rounded-lg border border-primary/20 bg-card",
    cardRow: "flex items-center gap-3",
    cardIcon: "w-10 h-10 bg-primary/10 rounded-lg shrink-0",
    cardBody: "flex-1",
    cardLinePrimary: "h-4 bg-primary/15 rounded w-3/4 mb-1",
    cardLineSecondary: "h-3 bg-primary/15 rounded w-1/2",
    cardAmount: "text-right shrink-0",
    cardAmountLine: "h-4 bg-primary/15 rounded w-16 mb-1",
    cardAmountSub: "h-3 bg-primary/15 rounded w-12",
    dayGroup: "space-y-3",
    dayGroupHeader: "flex items-center justify-between mb-2 px-1",
    dayGroupTitle: "h-5 bg-primary/15 rounded w-24",
    dayGroupTotal: "text-right",
    dayGroupTotalLine: "h-4 bg-primary/15 rounded w-16 mb-1",
    dayGroupTotalSub: "h-3 bg-primary/15 rounded w-12",
    tabNav: "flex gap-2 border-b border-primary/20 px-3 py-2",
    tabListSpacing: "flex gap-2 w-full",
    tabPill: "bg-primary/12 rounded-lg",
    tabPillHeight: "h-10",
    tabPillWidth: "w-24",
    recurring: "p-4 rounded-lg border border-primary/20 bg-card space-y-4",
    recurringListSpacing: "space-y-4",
    recurringRow: "flex items-center gap-3",
    recurringIcon: "w-10 h-10 bg-primary/10 rounded-lg shrink-0",
    recurringBody: "flex-1",
    recurringLinePrimary: "h-4 bg-primary/15 rounded w-3/4 mb-1",
    recurringLineSecondary: "h-3 bg-primary/15 rounded w-1/2",
    recurringAction: "w-8 h-8 bg-primary/12 rounded-lg shrink-0",
    fullPage: "flex flex-col min-h-dvh bg-card",
    main: "flex-1 p-3 space-y-6 pb-20",
    dayGroupListSpacing: "space-y-3",
    listSpacing: "space-y-6",
  },
  groupedCard: {
    variantRegular: transactionTokens.cardVariants.regular.card,
    variantRecurrent: transactionTokens.cardVariants.recurrent.card,
    headerRegular: transactionTokens.cardVariants.regular.header,
    headerRecurrent: transactionTokens.cardVariants.recurrent.header,
    headerContent: "flex items-center justify-between",
    headerLabel: "text-xs font-semibold text-primary/60 uppercase tracking-wider",
    headerAmount: "text-base font-bold",
    rowContainer: transactionTokens.groupedCard.borders.rowDivider,
    backdrop: "fixed inset-0 z-10",
    openState: "relative z-20",
  },
  filters: {
    container: "space-y-3",
    budgetBanner:
      "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20",
    budgetBannerLeft: "flex items-center gap-2",
    budgetBannerDot: "w-2 h-2 rounded-full bg-primary animate-pulse",
    budgetBannerText: "text-sm font-medium text-primary",
    budgetBannerCount: "text-xs text-primary/70",
    budgetBannerExit:
      "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors",
    budgetBannerExitIcon: "h-3 w-3",
    searchWrap: "relative",
    searchIcon: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
    searchIconActive: "text-primary",
    searchIconInactive: "text-primary/50",
    searchInput:
      "pl-12 pr-10 py-3 h-12 rounded-2xl bg-card border-primary/20 text-primary placeholder:text-primary/40 transition-all duration-200 focus:border-primary/20 focus:ring-2 focus:ring-primary/20 focus:shadow-lg",
    searchClear:
      "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors",
    searchClearIcon: "h-4 w-4 text-primary",
    chipsRow: "flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide",
    clearAll:
      "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 active:scale-[0.98] whitespace-nowrap",
    clearAllIcon: "h-3.5 w-3.5",
    chip: {
      wrapper: "relative inline-flex",
      buttonActive:
        "inline-flex items-center gap-2 pl-3 pr-8 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap select-none bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98]",
      clearButton:
        "absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors",
      clearIcon: "h-3 w-3 text-primary-foreground",
      buttonBase:
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap select-none active:scale-[0.98]",
      buttonOpen: "bg-primary text-primary-foreground shadow-md",
      buttonIdle: "bg-card text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5",
      chevron: "h-3.5 w-3.5 transition-transform duration-200",
      chevronOpen: "rotate-180",
    },
    drawer: {
      content: "rounded-t-3xl bg-card border-t border-primary/20",
      contentTall: "rounded-t-3xl bg-card border-t border-primary/20 max-h-[70vh]",
      inner: "p-4 space-y-4",
      header: "flex items-center justify-between",
      title: "text-lg font-bold text-primary",
      closeButton: "text-primary hover:bg-primary/10 rounded-xl",
    },
    typeGrid: "grid grid-cols-3 gap-2",
    typeButton:
      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border active:scale-95",
    typeButtonActive: "bg-primary text-primary-foreground border-primary/20 shadow-md",
    typeButtonIdle: "bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40",
    typeCheck: "h-4 w-4",
    dateSection: "space-y-4",
    dateGrid: "grid grid-cols-2 gap-2",
    dateButton:
      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border active:scale-95",
    dateButtonActive: "bg-primary text-primary-foreground border-primary/20 shadow-md",
    dateButtonIdle: "bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40",
    dateCustom: "space-y-3 pt-2 border-t border-primary/10",
    dateTitle: "text-sm font-medium text-primary",
    dateInputs: "grid grid-cols-2 gap-3",
    dateField: "space-y-1.5",
    dateLabel: "text-xs text-primary/70",
    dateInput: "bg-card border-primary/20 rounded-xl text-sm",
    dateApply: "w-full rounded-xl",
    categorySection: "space-y-3",
    categorySearchWrap: "relative",
    categorySearchIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50",
    categorySearchInput: "pl-10 bg-card border-primary/20 rounded-xl",
    categoryGrid: "grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1",
    categoryButton:
      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-95",
    categoryButtonActive: "bg-primary text-primary-foreground border-primary/20 shadow-md",
    categoryButtonIdle: "bg-card text-primary border-primary/20 hover:bg-primary/10",
    categoryLabel: "truncate",
    categoryLabelLeft: "truncate flex-1 text-left",
    categoryCheck: "h-4 w-4 shrink-0",
  },
  transactionRow: {
    wrapper: "relative overflow-hidden touch-pan-y group",
    deleteLayer: `${transactionTokens.groupedCard.row.deleteLayer}`,
    deleteButton: `${transactionTokens.groupedCard.deleteButton.base} ${transactionTokens.groupedCard.deleteButton.active}`,
    content: `${transactionTokens.groupedCard.spacing.rowPadding} ${transactionTokens.groupedCard.row.base} ${transactionTokens.groupedCard.row.hover} ${transactionTokens.groupedCard.borders.lastRowNoBorder}`,
    contentLayout: `flex items-center justify-between ${transactionTokens.groupedCard.spacing.rowGap}`,
    leftSection: `flex items-center ${transactionTokens.groupedCard.spacing.rowGap} flex-1 min-w-0`,
    icon: `${transactionTokens.groupedCard.icon.container} ${transactionTokens.groupedCard.icon.hover}`,
    details: "flex-1 min-w-0",
    title: transactionTokens.groupedCard.text.title,
    metadata: `flex items-center ${transactionTokens.groupedCard.spacing.contentGap} mt-0.5`,
    metadataText: transactionTokens.groupedCard.text.metadata,
    metadataSecondary: transactionTokens.groupedCard.text.metadataSecondary,
    separator: transactionTokens.groupedCard.text.separator,
    badge: transactionTokens.groupedCard.badge.base,
    rightSection: "text-right shrink-0",
    amount: transactionTokens.groupedCard.text.amount,
    amountSecondary: transactionTokens.groupedCard.text.amountSecondary,
    deleteLayerStyle: (isOpen: boolean, actionWidth: number): CSSProperties => ({
      width: `${actionWidth}px`,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
    }),
    motionStyle: (x: MotionValue<number>) => ({ x }),
  },
  dayList: {
    container: "space-y-6",
    sectionHeader: "mb-4",
    viewAllWrap: "flex justify-center mt-6",
    viewAllButton: "group",
    viewAllLabel: "mr-2 text-primary",
    viewAllArrow: "group-hover:translate-x-0.5 transition-transform duration-200 text-primary",
    skeleton: {
      container: "space-y-6",
      header: "mb-4",
      headerTitle: "h-5 w-40 bg-primary/15 rounded animate-pulse",
      headerSubtitle: "h-4 w-32 bg-primary/10 rounded animate-pulse mt-1",
      group: "space-y-3",
      groupHeader: "flex justify-between items-center",
      groupTitle: "h-4 w-24 bg-primary/15 rounded animate-pulse",
      groupTotal: "text-right",
      groupTotalLine: "h-4 w-16 bg-primary/15 rounded animate-pulse",
      groupTotalSub: "h-3 w-20 bg-primary/10 rounded animate-pulse mt-1",
      card: "bg-card rounded-xl border border-primary/20 p-3 space-y-3",
      row: "flex items-center gap-3",
      rowIcon: "w-10 h-10 rounded-lg bg-primary/12 animate-pulse",
      rowBody: "flex-1 space-y-2",
      rowTitle: "h-4 w-32 bg-primary/15 rounded animate-pulse",
      rowSubtitle: "h-3 w-20 bg-primary/10 rounded animate-pulse",
      rowAmount: "h-5 w-16 bg-primary/15 rounded animate-pulse",
    },
  },
} as const;

export function getTransactionTypeStyles(type: "expense" | "income" | "transfer") {
  return transactionTokens.type[type];
}

export function getAmountStyles(type: "expense" | "income" | "transfer") {
  const typeStyles = transactionTokens.type[type];
  return {
    text: typeStyles.text,
    prefix: type === "expense" ? "-" : type === "income" ? "+" : "",
  };
}

export function getIconStyles(type: "expense" | "income" | "transfer") {
  return transactionTokens.type[type].icon;
}

export function getDayTotalStyles(total: number) {
  return {
    value:
      total >= 0
        ? transactionStyles.dayGroup.statsTotalValuePositive
        : transactionStyles.dayGroup.statsTotalValueNegative,
  };
}

export function getCardVariantStyles(variant: "regular" | "recurrent") {
  return variant === "recurrent"
    ? transactionStyles.groupedCard.variantRecurrent
    : transactionStyles.groupedCard.variantRegular;
}

export function getHeaderVariantStyles(variant: "regular" | "recurrent") {
  return variant === "recurrent"
    ? transactionStyles.groupedCard.headerRecurrent
    : transactionStyles.groupedCard.headerRegular;
}

export function getTotalAmountColor(variant: "regular" | "recurrent", amount: number) {
  if (variant === "recurrent") return "text-primary";
  return amount >= 0 ? "text-success" : "text-destructive";
}

export function getTransactionAmountColor(
  transaction: Pick<Transaction, "type">,
  variant: "regular" | "recurrent"
) {
  if (variant === "recurrent") return "text-primary";
  if (transaction.type === "transfer") return "text-primary";
  return transaction.type === "income" ? "text-success" : "text-destructive";
}

export function getTransactionIconColor(
  variant: "regular" | "recurrent",
  context: "due" | "informative",
  daysUntilDue: number
) {
  if (variant === "recurrent" && context === "due") {
    if (daysUntilDue <= 1) return transactionTokens.contextColors.due.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.due.warning;
    return transactionTokens.contextColors.due.normal;
  }
  return "bg-primary/10 text-primary";
}

export function getTransactionBadgeColor(
  variant: "regular" | "recurrent",
  context: "due" | "informative",
  daysUntilDue: number
) {
  if (variant === "recurrent" && context === "due") {
    if (daysUntilDue <= 1) return transactionTokens.contextColors.dueBadge.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.dueBadge.warning;
    return transactionTokens.contextColors.dueBadge.normal;
  }
  return "";
}

// ============================================================================
// COMPONENT STYLE UTILITIES
// Reusable style combinations for common UI components
// ============================================================================

// Button styles
export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
  variants: {
    default: `bg-primary text-primary-foreground border border-primary/20 hover:bg-primary/90`,
    secondary: `bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/90`,
    outline: `border border-primary/20 bg-card text-primary hover:bg-primary hover:text-primary-foreground`,
    ghost: `hover:bg-primary/10 text-primary`,
    destructive: `bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90`,
    cancel: `bg-card text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground`,
  },
  sizes: {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3",
    lg: "h-10 px-6",
    icon: "size-9",
  },
};

// Card styles
export const cardStyles = {
  container: `bg-card text-primary flex flex-col rounded-xl border border-primary/20 shadow-sm`,
  header: "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
  title: "leading-none font-semibold text-primary",
  description: "text-primary/70 text-sm",
  content: "px-6",
  footer: "flex items-center px-6 [.border-t]:pt-6",
  action: "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
};

// Input styles
export const inputStyles = {
  base: "bg-card text-primary border border-primary/20 rounded-xl px-3 py-2 text-base transition-[color,box-shadow,background-color] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 placeholder:text-primary/40 selection:bg-primary selection:text-primary-foreground",
};

// Skeleton styles
export const skeletonStyles = {
  base: "animate-pulse",
  light: "bg-primary/10",
  medium: "bg-primary/15",
  dark: "bg-primary/20",
  shimmer: `liquid-shimmer bg-primary/12`,
};

// Modal / dialog styles
export const modalStyles = {
  content: "sm:max-w-[420px] border border-primary/15 bg-card shadow-xl",
  footer: "px-5 sm:px-6 pb-5 sm:pb-6 pt-4 sm:pt-5 border-t border-border/60 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
};

// Tabs styles
export const tabStyles = {
  list: "inline-flex h-12 items-center justify-center rounded-2xl bg-primary/10 p-1",
  trigger:
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
  content: "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
};

// Badge styles
export const badgeStyles = {
  base: "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow,background-color] [&>svg]:size-3 [&>svg]:pointer-events-none",
  variants: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "text-primary border-primary/20 hover:bg-primary/10",
  },
};

// Drawer styles
export const drawerStyles = {
  content: "fixed bottom-0 left-0 right-0 z-50 flex h-auto max-h-[85vh] flex-col rounded-t-3xl border-t border-primary/20 bg-card shadow-xl overflow-hidden",
  header: "grid gap-1.5 p-4 text-center sm:text-left",
  footer: "mt-auto flex flex-col gap-2 p-4",
};

// Select styles
export const selectStyles = {
  trigger:
    "flex h-10 w-full items-center justify-between rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  icon: "h-4 w-4 text-primary/60",
  content:
    "relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-primary/20 bg-card text-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  viewportBase: "p-1",
  item:
    "relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm text-primary outline-none transition-colors focus:bg-primary focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  itemIndicator: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
  separator: "-mx-1 my-1 h-px bg-primary/15",
  label: "py-1.5 pl-8 pr-2 text-sm font-semibold text-primary",
};

// Dropdown styles
export const dropdownStyles = {
  content:
    "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-primary/20 bg-card p-1 text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  item:
    "relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-primary outline-none transition-colors focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  subTrigger:
    "flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-primary outline-none focus:bg-primary/10 data-[state=open]:bg-primary/10",
  subContent:
    "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-primary/20 bg-card p-1 text-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  checkboxItem:
    "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-primary outline-none transition-colors focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  radioItem:
    "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-primary outline-none transition-colors focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  label: "px-3 py-1.5 text-sm font-semibold text-primary",
  separator: "-mx-1 my-1 h-px bg-primary/15",
  shortcut: "ml-auto text-xs tracking-widest opacity-70",
  indicator: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
};

// Empty state styles
export const emptyStateStyles = {
  container: "py-12 text-center",
  iconWrapper: "flex justify-center mb-4",
  icon: "h-12 w-12 text-primary",
  title: "text-lg font-semibold text-primary mb-2",
  description: "text-sm text-primary/70 mb-4 max-w-md mx-auto",
  action: "mt-6",
};

// Alert styles
export const alertStyles = {
  base: "rounded-xl border border-primary/20 bg-primary/10 text-primary px-4 py-3 flex items-start gap-3",
  icon: "h-5 w-5 text-primary shrink-0",
  title: "font-semibold text-primary",
  description: "text-sm text-primary/80",
};

// Sticky header styles
export const stickyHeaderStyles = {
  base: "fixed top-0 left-0 right-0 backdrop-blur-xl border-b border-primary/20 shadow-sm bg-card/80",
  light: "bg-card/80 border-primary/20",
};

// Utility to combine size + variant for buttons
export function getButtonClasses(variant: keyof typeof buttonStyles.variants, size: keyof typeof buttonStyles.sizes = "default", extra?: string) {
  return [buttonStyles.base, buttonStyles.variants[variant], buttonStyles.sizes[size], extra].filter(Boolean).join(" ");
}
