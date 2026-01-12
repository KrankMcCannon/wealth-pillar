/**
 * Page Loader Styles
 * Centralized classNames for PageLoader component
 */

export const pageLoaderStyles = {
  page: 'relative flex w-full min-h-[100svh] flex-col bg-card',
  container: 'flex-1 flex items-center justify-center',
  content: 'text-center',
  iconWrap: 'flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4 animate-pulse',
  icon: 'w-8 h-8 text-primary animate-spin',
  message: 'text-sm font-semibold text-primary',
  submessage: 'text-xs text-primary/70 mt-1',
} as const;
