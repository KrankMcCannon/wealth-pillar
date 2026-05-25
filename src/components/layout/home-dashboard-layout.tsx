import type { ReactNode } from 'react';
import { cn } from '@/lib';

export const dashboardContentBottomPadding =
  'pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]';

const homeDashboardLayoutStyles = {
  main: `flex min-h-0 w-full flex-col gap-6 px-4 pt-4 ${dashboardContentBottomPadding}`,
  skipLink:
    'sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none',
};

interface HomeDashboardMainProps {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaBusy?: boolean;
}

export function HomeDashboardMain({
  children,
  className,
  id = 'main-dashboard',
  ariaBusy,
}: HomeDashboardMainProps) {
  return (
    <main
      id={id}
      aria-busy={ariaBusy ? true : undefined}
      className={cn(homeDashboardLayoutStyles.main, className)}
    >
      {children}
    </main>
  );
}

interface SkipToMainLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SkipToMainLink({ href, children, className }: SkipToMainLinkProps) {
  return (
    <a href={href} className={cn(homeDashboardLayoutStyles.skipLink, className)}>
      {children}
    </a>
  );
}
