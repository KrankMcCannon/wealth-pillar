/**
 * Shared feedback styles (confirmation dialog, error/empty states)
 * Centralizes styling to stay consistent with the mobile app UI.
 */

export const confirmationDialogStyles = {
  content: "sm:max-w-[420px] border border-primary/15 bg-card shadow-xl",
  header: "p-4",
  headerLayout: "flex items-start gap-3",
  iconWrapper:
    "flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-destructive",
  icon: "size-6",
  text: {
    title: "text-lg font-semibold text-foreground",
    message: "text-sm text-muted-foreground leading-relaxed",
  },
  body: "flex-1 space-y-2",
  footer: "p-4 border-t border-border/60 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
  buttons: {
    cancel:
      "w-full sm:w-auto font-semibold border border-primary text-primary bg-white hover:bg-primary hover:text-white",
    confirm: "w-full sm:w-auto font-semibold gap-2",
  },
  loadingIcon: "size-4 animate-spin",
};

export const notFoundStyles = {
  page: "bg-card",
  header: {
    container: "px-4 pt-6 pb-3",
    inner: "flex items-center gap-3",
    titleGroup: "flex flex-col gap-0.5",
    label: "text-xs font-semibold uppercase tracking-wide text-primary/80",
    title: "text-xl font-bold text-primary",
    subtitle: "text-sm text-primary/80",
  },
  content: {
    container: "flex flex-1 items-center justify-center px-4 pb-10",
    card: "w-full max-w-md rounded-2xl bg-card shadow-xl border border-primary/10 p-6 space-y-6 text-center",
    illustration: "mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary",
    illustrationIcon: "h-8 w-8",
    badge: "mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary",
    title: "text-2xl font-bold text-primary",
    description: "text-sm leading-relaxed text-primary/80",
    actions: "grid gap-3 sm:grid-cols-2",
    actionLink: "w-full",
    backButton: "w-full",
    homeButton: "w-full",
    actionIcon: "h-4 w-4",
  },
};
