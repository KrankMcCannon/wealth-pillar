// eslint-disable-next-line camelcase
import { experimental_createTheme, shadcn } from '@clerk/themes';
import type { Theme } from '@clerk/shared/types';

/**
 * Overrides on top of shadcn theme.
 * Clerk defaults to iconButton when 3+ OAuth providers are enabled; we force blockButton for readable labels.
 */
const wealthPillarAuthTheme = experimental_createTheme({
  name: 'wealth-pillar-auth',
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    shimmer: false,
  },
  elements: {
    socialButtons: 'flex w-full flex-col gap-3',
    socialButtonsBlockButton:
      'flex h-12 w-full min-w-0 items-center justify-center gap-3 rounded-xl border border-border/30 bg-muted/35 px-4',
    socialButtonsIconButton:
      'flex h-12 w-full min-w-0 items-center justify-center gap-3 rounded-xl border border-border/30 bg-muted/35 px-4',
    socialButtonsBlockButtonText: 'text-sm font-semibold',
    socialButtonsProviderIcon: 'size-5 shrink-0',
    rootBox: 'w-full max-w-md mx-auto px-4',
    cardBox: 'w-full rounded-2xl shadow-lg',
    headerTitle: 'text-xl font-semibold tracking-tight',
    headerSubtitle: 'text-sm',
    formButtonPrimary: 'h-12 w-full',
    formFieldInput: 'h-11',
  },
});

export const clerkAppearance = {
  theme: [shadcn, wealthPillarAuthTheme],
  variables: {
    borderRadius: '1rem',
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif',
    fontSize: '0.95rem',
  },
} as Theme;
