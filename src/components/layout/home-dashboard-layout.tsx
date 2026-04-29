import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { homeDashboardLayoutStyles } from './theme/home-dashboard-layout-styles';

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
