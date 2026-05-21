'use client';

import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { clerkAppearance } from '@/features/auth/theme/clerk-appearance';
import { AuthPageWrapper } from '@/features/auth';
import { authSsoCallbackPath } from '@/lib/auth/post-auth-paths';
import type { AppLocale } from '@/i18n/routing';

export default function SignInPage(): React.JSX.Element {
  const locale = useLocale() as AppLocale;

  return (
    <AuthPageWrapper>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl={authSsoCallbackPath(locale)}
      />
    </AuthPageWrapper>
  );
}
