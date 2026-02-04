export const checkboxComponentStyles = {
  root: 'peer h-4 w-4 shrink-0 rounded-sm border border-primary/30 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary/20 data-[state=checked]:text-primary-foreground transition-colors',
  indicator: 'flex items-center justify-center text-current',
  icon: 'h-3 w-3',
} as const;
