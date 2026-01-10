export const toastComponentStyles = {
  closeButton:
    "absolute right-3 top-3 rounded-md p-1 text-current/70 transition-opacity hover:text-current focus-visible:ring-2 focus-visible:ring-primary/30",
  closeIcon: "h-4 w-4",
  title: "text-sm font-semibold leading-none",
  description: "text-sm text-muted-foreground",
  toasterItem: "grid gap-1",
} as const;
