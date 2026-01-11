/**
 * Shared Feedback Styles
 * Confirmation dialogs, error states, and empty states
 *
 * Uses centralized style registry from @/styles/system
 * Centralizes styling to stay consistent with the mobile app UI
 */

import { radiusStyles, shadowStyles, typographyStyles } from "@/styles/system";

export const confirmationDialogStyles = {
  content: `sm:max-w-[420px] border border-primary/15 bg-card ${shadowStyles.xl}`,
  header: 'p-4',
  headerLayout: 'flex items-start gap-3',
  iconWrapper: `flex size-12 shrink-0 items-center justify-center ${radiusStyles.md} bg-destructive/10 border border-destructive/20 text-destructive`,
  icon: 'size-6',
  text: {
    title: `${typographyStyles.lg} font-semibold text-primary`,
    message: `${typographyStyles.sm} text-primary leading-relaxed`,
  },
  body: 'flex-1 space-y-2',
  footer: `p-4 border-t border-border/60 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end`,
  buttons: {
    cancel: "w-full sm:w-auto font-semibold border border-primary/20 text-primary bg-card hover:bg-primary hover:text-primary-foreground",
    confirm: 'w-full sm:w-auto font-semibold gap-2',
  },
  loadingIcon: 'size-4 animate-spin',
} as const;

export const notFoundStyles = {
  page: "bg-card",
  header: {
    container: 'px-4 pt-6 pb-3',
    inner: 'flex items-center gap-3',
    titleGroup: 'flex flex-col gap-0.5',
    label: `${typographyStyles.xs} font-semibold uppercase tracking-wide text-primary/80`,
    title: `${typographyStyles.xl} font-bold text-primary`,
    subtitle: `${typographyStyles.sm} text-primary/80`,
  },
  content: {
    container: 'flex flex-1 items-center justify-center px-4 pb-10',
    card: `w-full max-w-md ${radiusStyles.lg} bg-card ${shadowStyles.xl} border border-primary/20 p-6 space-y-6 text-center`,
    illustration: `mx-auto flex size-16 items-center justify-center ${radiusStyles.lg} bg-primary/15 text-primary`,
    illustrationIcon: 'h-8 w-8',
    badge: `mx-auto inline-flex items-center gap-2 ${radiusStyles.full} bg-primary/30 px-3 py-1 ${typographyStyles.xs} font-semibold text-primary`,
    title: `${typographyStyles["2xl"]} font-bold text-primary`,
    description: `${typographyStyles.sm} leading-relaxed text-primary/80`,
    actions: 'grid gap-3 sm:grid-cols-2',
    actionLink: 'w-full',
    backButton: 'w-full',
    homeButton: 'w-full',
    backButtonVariant: "bg-card text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground",
    actionIcon: 'h-4 w-4',
  },
} as const;
