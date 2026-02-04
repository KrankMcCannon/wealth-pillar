import React from 'react';
import { SignIn, GoogleOneTap } from '@clerk/nextjs';
import { clerkAppearance } from '@/features/auth/theme/clerk-appearance';
import { AuthPageWrapper } from '@/features/auth';

export default function SignInPage(): React.JSX.Element {
  return (
    <AuthPageWrapper>
      <GoogleOneTap />
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl="/auth/sso-callback"
      />
    </AuthPageWrapper>
  );
}
