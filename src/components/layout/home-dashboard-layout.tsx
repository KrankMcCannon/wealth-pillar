import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { dashboardContentBottomPadding } from '@/styles/home-design-foundation';

export { dashboardContentBottomPadding };

const homeDashboardLayoutStyles = {
  main: `flex min-h-0 w-full flex-col gap-6 px-4 pt-4 ${dashboardContentBottomPadding}`,
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
