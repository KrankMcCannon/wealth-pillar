export const bottomNavigationStyles = {
  container:
    "fixed bottom-0 left-0 right-0 z-[110] bg-card border-t border-primary/20 px-4 py-2 safe-area-pb",
  inner: "flex items-center justify-around",
  item:
    "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
  itemActive: "bg-primary text-primary-foreground",
  itemInactive: "text-primary/70 hover:text-primary",
  icon: "h-5 w-5",
} as const;
