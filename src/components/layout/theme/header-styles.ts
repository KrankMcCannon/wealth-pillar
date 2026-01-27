export const headerStyles = {
  container: "px-3 sm:px-4 py-2.5 z-40 transition-all duration-200",
  inner: "flex items-center justify-between w-full mx-auto",
  left: "flex items-center gap-4",
  dashboard: {
    wrapper: "flex items-center gap-3",
    avatarWrap: "relative",
    avatar:
      "h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-base border-2 border-primary shadow-sm overflow-hidden",
    crownWrap:
      "absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-primary shadow-sm",
    crownIcon: "h-3 w-3 text-amber-500 fill-current",
    userInfo: "hidden sm:block leading-none",
    userName: "text-lg font-semibold text-primary truncate max-w-[140px]",
    userRole: "text-xs text-primary/60 font-medium mt-0.5 capitalize",
  },
  subpage: {
    wrapper: "flex items-center gap-3",
    backButton:
      "h-10 w-10 -ml-2 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors",
    backIcon: "h-5.5 w-5.5",
    title: "text-lg font-semibold text-primary leading-tight",
    subtitle: "text-xs text-primary/60",
  },
  actions: {
    wrapper: "flex items-center gap-2 sm:gap-3",
    actionButton:
      "h-11 w-11 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90",
    actionIcon: "h-5.5 w-5.5",
    menu: "w-56",
    menuIcon: "mr-2 h-4 w-4",
    iconButton: "h-10 w-10 rounded-full text-primary hover:bg-primary/5",
    icon: "h-5.5 w-5.5",
    badge:
      "flex items-center px-3 py-2 border rounded-full text-sm font-semibold",
  },
} as const;
