import React from 'react';
import { SignUp } from '@clerk/nextjs';
import { getLocale } from 'next-intl/server';
import { clerkAppearance } from '@/features/auth/theme/clerk-appearance';
import { AuthPageWrapper } from '@/features/auth';
import { authSsoCallbackPath } from '@/lib/auth/post-auth-paths';
import type { AppLocale } from '@/i18n/routing';

export default async function SignUpPage(): Promise<React.JSX.Element> {
  const locale = (await getLocale()) as AppLocale;

  return (
    <AuthPageWrapper>
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        forceRedirectUrl={authSsoCallbackPath(locale)}
      />
    </AuthPageWrapper>
  );
}
