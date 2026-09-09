/**
 * Auth layout tokens — mobile-first, aligned with onboarding shell.
 */

import { stitchSurface } from '@/styles/home-design-foundation';

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
    footerText: 'text-xs text-muted-foreground',
  },
  errorPage: {
    container: 'flex flex-col gap-4',
    description: 'text-sm text-center text-muted-foreground',
  },
  card: {
    container: 'w-full',
    surface: `${stitchSurface.cardLg} p-4`,
    header: 'mb-4 text-center',
    brand: 'text-lg font-bold tracking-tight text-primary',
    title: 'text-xl font-semibold text-foreground',
    subtitle: 'mt-1 text-center text-sm text-muted-foreground',
  },
} as const;
