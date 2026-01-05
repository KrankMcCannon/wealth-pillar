/**
 * Centralized style system
 * Single source of truth for tokens and shared component style patterns.
 */

// Core tokens (derived from CSS custom properties in app/globals.css)
export const tokens = {
  color: {
    primary: "text-primary",
    primaryBg: "bg-primary",
    primarySoft: "bg-primary/10",
    primarySofter: "bg-primary/15",
    primaryBorder: "border-primary/20",
    primaryBorderStrong: "border-primary/15",
    card: "bg-card",
    cardBorder: "border-border",
    text: "text-primary",
    textMuted: "text-primary/70",
    destructive: "text-destructive",
  },
  layout: {
    radius: "rounded-xl",
    radiusLg: "rounded-2xl",
    radiusFull: "rounded-full",
    padding: "px-4 py-3",
  },
  effect: {
    shadowCard: "shadow-sm",
    shadowElevated: "shadow-xl",
    shimmer: "liquid-shimmer",
  },
};

// Button styles
export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
  variants: {
    default: `bg-primary text-primary-foreground border border-primary hover:bg-primary/90`,
    secondary: `bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/90`,
    outline: `border ${tokens.color.primaryBorder} bg-card text-primary hover:bg-primary hover:text-white`,
    ghost: `hover:bg-primary/10 text-primary`,
    destructive: `bg-destructive text-white border border-destructive hover:bg-destructive/90`,
    cancel: `bg-white text-primary border border-primary hover:bg-primary hover:text-white`,
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
  container: `bg-card text-primary flex flex-col ${tokens.layout.radius} border ${tokens.color.primaryBorder} ${tokens.effect.shadowCard}`,
  header: "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
  title: "leading-none font-semibold text-primary",
  description: "text-primary/70 text-sm",
  content: "px-6",
  footer: "flex items-center px-6 [.border-t]:pt-6",
  action: "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
};

// Input styles
export const inputStyles = {
  base: "bg-card text-primary border border-primary/20 rounded-xl px-3 py-2 text-base transition-[color,box-shadow,background-color] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-primary/40 selection:bg-primary selection:text-primary-foreground",
};

// Skeleton styles
export const skeletonStyles = {
  base: "animate-pulse",
  light: "bg-primary/10",
  medium: "bg-primary/15",
  dark: "bg-primary/20",
  shimmer: `${tokens.effect.shimmer} bg-primary/12`,
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
    destructive: "border-transparent bg-destructive text-white hover:bg-destructive/90",
    outline: "text-primary border-primary hover:bg-primary/10",
  },
};

// Drawer styles
export const drawerStyles = {
  content: "fixed top-[50%] left-[50%] z-50 flex h-auto w-[90%] max-w-[90%] max-h-[70vh] flex-col rounded-2xl border border-primary/20 bg-card shadow-xl translate-x-[-50%] translate-y-[-50%] overflow-hidden",
  header: "grid gap-1.5 p-4 text-center sm:text-left",
  footer: "mt-auto flex flex-col gap-2 p-4",
};

// Select styles
export const selectStyles = {
  trigger:
    "flex h-10 w-full items-center justify-between rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  icon: "h-4 w-4 text-primary/60",
  content:
    "relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-primary/20 bg-card text-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  viewportBase: "p-1",
  item:
    "relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm text-primary outline-none transition-colors focus:bg-primary focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
