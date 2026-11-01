import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { dashboardContentBottomPadding } from '@/styles/home-design-foundation';

export { dashboardContentBottomPadding };

const homeDashboardLayoutStyles = {
  main: `mx-auto flex min-h-0 w-full max-w-5xl flex-col gap-5 px-4 pt-4 ${dashboardContentBottomPadding}`,
};

interface HomeDashboardMainProps {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaBusy?: boolean;
  'aria-label'?: string;
}

export function HomeDashboardMain({
  children,
  className,
  id = 'main-dashboard',
  ariaBusy,
  'aria-label': ariaLabel,
}: HomeDashboardMainProps) {
  return (
    <main
      id={id}
      aria-busy={ariaBusy ? true : undefined}
      aria-label={ariaLabel}
      className={cn(homeDashboardLayoutStyles.main, className)}
    >
      {children}
    </main>
  );
}
