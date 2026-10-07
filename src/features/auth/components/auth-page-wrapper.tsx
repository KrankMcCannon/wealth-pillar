import type { ReactNode } from 'react';
import { authStyles } from '../theme';

type AuthPageWrapperProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  trustNote?: string;
};

/** Centers Clerk sign-in/sign-up on mobile full-screen auth routes. */
export function AuthPageWrapper({
  children,
  title,
  subtitle,
  trustNote,
}: Readonly<AuthPageWrapperProps>) {
  return (
    <div className={`auth-clerk-shell ${authStyles.page.wrapper}`}>
      {title || subtitle || trustNote ? (
        <header className="mb-6 px-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Wealth Pillar
          </p>
          {title ? (
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          {trustNote ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{trustNote}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
