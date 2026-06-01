import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { getLocale } from 'next-intl/server';
import { clerkAppearance } from '@/features/auth/theme/clerk-appearance';
import { AuthPageWrapper } from '@/features/auth';
import { authSsoCallbackPath } from '@/lib/auth/post-auth-paths';
import { CLERK_SIGN_UP_URL } from '@/lib/auth/clerk-config';
import type { AppLocale } from '@/i18n/routing';

export default async function SignInPage(): Promise<React.JSX.Element> {
  const locale = (await getLocale()) as AppLocale;

  return (
    <AuthPageWrapper>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl={CLERK_SIGN_UP_URL}
        forceRedirectUrl={authSsoCallbackPath(locale)}
      />
    </AuthPageWrapper>
  );
}
