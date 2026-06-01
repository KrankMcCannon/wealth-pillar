import type { ReactNode } from 'react';
import { authStyles } from '../theme';

type AuthPageWrapperProps = {
  children: ReactNode;
};

/** Centers Clerk sign-in/sign-up on mobile full-screen auth routes. */
export function AuthPageWrapper({ children }: Readonly<AuthPageWrapperProps>) {
  return <div className={`auth-clerk-shell ${authStyles.page.wrapper}`}>{children}</div>;
}
