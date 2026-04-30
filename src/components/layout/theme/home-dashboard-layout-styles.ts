/** Riserva unica sopra la bottom bar fissa (+ FAB); non duplicare in `mainStack` / tab. */
export const dashboardContentBottomPadding =
  'pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]';

export const homeDashboardLayoutStyles = {
  main: `flex min-h-0 w-full flex-col gap-6 px-4 pt-4 ${dashboardContentBottomPadding}`,
  skipLink:
    'sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-[#050818] motion-reduce:transition-none',
} as const;
