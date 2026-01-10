/**
 * Shared Feedback Styles
 * Confirmation dialogs, error states, and empty states
 *
 * Uses core design tokens from @/styles/core-tokens
 * Centralizes styling to stay consistent with the mobile app UI
 */

import { coreTokens } from '@/styles/core-tokens';

export const confirmationDialogStyles = {
  content: `sm:max-w-[420px] border border-primary/15 bg-[${coreTokens.color.card}] ${coreTokens.shadow.xl}`,
  header: 'p-4',
  headerLayout: 'flex items-start gap-3',
  iconWrapper: `flex size-12 shrink-0 items-center justify-center ${
    coreTokens.radius.md
  } bg-destructive/10 border border-destructive/20 text-[${coreTokens.color.destructive}]`,
  icon: 'size-6',
  text: {
    title: `${coreTokens.typography.lg} font-semibold text-[${coreTokens.color.foreground}]`,
    message: `${coreTokens.typography.sm} text-[${coreTokens.color.mutedForeground}] leading-relaxed`,
  },
  body: 'flex-1 space-y-2',
  footer: `p-4 border-t border-border/60 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end`,
  buttons: {
    cancel: `w-full sm:w-auto font-semibold border border-[${coreTokens.color.primary}] text-[${coreTokens.color.primary}] bg-white hover:bg-[${coreTokens.color.primary}] hover:text-[${coreTokens.color.primaryForeground}]`,
    confirm: 'w-full sm:w-auto font-semibold gap-2',
  },
  loadingIcon: 'size-4 animate-spin',
} as const;

export const notFoundStyles = {
  page: `bg-[${coreTokens.color.card}]`,
  header: {
    container: 'px-4 pt-6 pb-3',
    inner: 'flex items-center gap-3',
    titleGroup: 'flex flex-col gap-0.5',
    label: `${coreTokens.typography.xs} font-semibold uppercase tracking-wide text-primary/80`,
    title: `${coreTokens.typography.xl} font-bold text-[${coreTokens.color.primary}]`,
    subtitle: `${coreTokens.typography.sm} text-primary/80`,
  },
  content: {
    container: 'flex flex-1 items-center justify-center px-4 pb-10',
    card: `w-full max-w-md ${coreTokens.radius.lg} bg-[${coreTokens.color.card}] ${
      coreTokens.shadow.xl
    } border border-primary/10 p-6 space-y-6 text-center`,
    illustration: `mx-auto flex size-16 items-center justify-center ${
      coreTokens.radius.lg
    } bg-primary/15 text-[${coreTokens.color.primary}]`,
    illustrationIcon: 'h-8 w-8',
    badge: `mx-auto inline-flex items-center gap-2 ${
      coreTokens.radius.full
    } bg-primary/10 px-3 py-1 ${
      coreTokens.typography.xs
    } font-semibold text-[${coreTokens.color.primary}]`,
    title: `${coreTokens.typography['2xl']} font-bold text-[${coreTokens.color.primary}]`,
    description: `${coreTokens.typography.sm} leading-relaxed text-primary/80`,
    actions: 'grid gap-3 sm:grid-cols-2',
    actionLink: 'w-full',
    backButton: 'w-full',
    homeButton: 'w-full',
    backButtonVariant: `bg-white text-[${coreTokens.color.primary}] border-[${coreTokens.color.primary}] hover:bg-[${coreTokens.color.primary}] hover:text-[${coreTokens.color.primaryForeground}]`,
    actionIcon: 'h-4 w-4',
  },
} as const;
