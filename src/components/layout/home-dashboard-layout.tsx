import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { homeDashboardLayoutStyles } from './theme/home-dashboard-layout-styles';

interface HomeDashboardMainProps {
  children: ReactNode;
  className?: string;
  /** Default allineato a landmark home per skip link. */
  id?: string;
  /** Stato caricamento (es. skeleton home) per screen reader. */
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

interface HomeDashboardGridProps {
  asideAriaLabel: string;
  primary: ReactNode;
  aside: ReactNode;
  className?: string;
}

export function HomeDashboardGrid({
  asideAriaLabel,
  primary,
  aside,
  className,
}: HomeDashboardGridProps) {
  return (
    <div className={cn(homeDashboardLayoutStyles.grid, className)}>
      <div className={homeDashboardLayoutStyles.primaryColumn}>{primary}</div>
      <aside aria-label={asideAriaLabel} className={homeDashboardLayoutStyles.asideColumn}>
        {aside}
      </aside>
    </div>
  );
}

interface SkipToMainLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** Link “Salta al contenuto” — primo elemento nel PageContainer sulla home. */
export function SkipToMainLink({ href, children, className }: SkipToMainLinkProps) {
  return (
    <a href={href} className={cn(homeDashboardLayoutStyles.skipLink, className)}>
      {children}
    </a>
  );
}
