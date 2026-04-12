'use client';

import React from 'react';
import { SignIn, GoogleOneTap } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { clerkAppearance } from '@/features/auth/theme/clerk-appearance';
import { AuthPageWrapper } from '@/features/auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { authSsoCallbackPath } from '@/lib/auth/post-auth-paths';
import type { AppLocale } from '@/i18n/routing';

/** Show GoogleOneTap only on viewport >= 768px to avoid overlapping the form on mobile. */
const MOBILE_BREAKPOINT = '(min-width: 768px)';

export default function SignInPage(): React.JSX.Element {
  const isDesktop = useMediaQuery(MOBILE_BREAKPOINT);
  const locale = useLocale() as AppLocale;

  return (
    <AuthPageWrapper>
      {isDesktop && <GoogleOneTap cancelOnTapOutside />}
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl={authSsoCallbackPath(locale)}
      />
    </AuthPageWrapper>
  );
}
