export const headerStyles = {
  container: 'px-4 py-2.5 z-40',
  inner: 'flex h-11 items-center',
  slotLeft: 'flex flex-1 items-center justify-start',
  slotCenter: 'flex shrink-0 items-center justify-center px-2',
  slotRight: 'flex flex-1 items-center justify-end',
  avatar:
    'flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary',
  avatarButton:
    'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1738]',
  appName: 'text-base font-semibold text-foreground',
  pageTitle: 'text-base font-semibold text-foreground',
  subtitle: 'text-xs text-muted-foreground',
  backButton:
    'flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1738]',
  backIcon: 'h-5 w-5',
  iconButton:
    'flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1738]',
  icon: 'h-5 w-5',
} as const;
