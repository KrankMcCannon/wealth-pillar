/**
 * Auth layout tokens — mobile-first, aligned with onboarding shell.
 */

import { typographyStyles } from '@/features/budgets/theme/budget-styles';

export const authStyles = {
  page: {
    wrapper:
      'flex w-full max-w-md mx-auto flex-1 flex-col justify-center px-4 py-6 pb-[calc(theme(spacing.6)+env(safe-area-inset-bottom))]',
  },
  layout: {
    container: 'flex min-h-dvh w-full flex-col bg-background',
    main: 'flex min-h-0 w-full flex-1 flex-col',
    footer:
      'mt-auto w-full px-4 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))] pt-2 text-center',
    footerText: `${typographyStyles.xs} text-muted-foreground`,
  },
  errorPage: {
    container: 'flex flex-col gap-4',
    description: `${typographyStyles.sm} text-center text-muted-foreground`,
  },
  card: {
    container: 'w-full',
    surface: 'rounded-2xl border border-border/25 bg-card p-4 shadow-lg',
    header: 'mb-4 text-center',
    brand: 'text-lg font-bold tracking-tight text-primary',
    title: 'text-xl font-semibold text-foreground',
    subtitle: 'mt-1 text-center text-sm text-muted-foreground',
  },
} as const;
