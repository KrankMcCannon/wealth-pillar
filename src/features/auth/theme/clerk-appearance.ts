// eslint-disable-next-line camelcase
import { experimental_createTheme, shadcn } from '@clerk/themes';
import type { Theme } from '@clerk/shared/types';

/**
 * Overrides on top of shadcn theme.
 * Clerk defaults to iconButton when 3+ OAuth providers are enabled; we force blockButton for readable labels.
 */
const wealthPillarAuthTheme = experimental_createTheme({
  name: 'wealth-pillar-auth',
  elements: {
    socialButtons: 'grid w-full grid-cols-1 gap-3',
    socialButtonsBlockButton:
      'flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border/30 bg-muted/35 px-4',
    socialButtonsIconButton:
      'flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border/30 bg-muted/35 px-4',
    socialButtonsBlockButtonText: 'text-sm font-semibold whitespace-nowrap',
    socialButtonsProviderIcon: 'size-5 shrink-0',
    rootBox: 'mx-auto w-full',
    cardBox: 'mx-auto w-full rounded-2xl shadow-lg',
    headerTitle: 'text-xl font-semibold tracking-tight',
    headerSubtitle: 'text-sm',
    formButtonPrimary: 'h-12 w-full',
    formFieldInput: 'h-11',
  },
});

export const clerkAppearance = {
  theme: [shadcn, wealthPillarAuthTheme],
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    shimmer: false,
  },
  variables: {
    borderRadius: '1rem',
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif',
    fontSize: '0.95rem',
  },
} as Theme;
