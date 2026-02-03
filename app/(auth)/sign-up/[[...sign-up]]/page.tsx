import React from "react";
import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/features/auth/theme/clerk-appearance";
import { AuthPageWrapper } from "@/features/auth";

export default function SignUpPage(): React.JSX.Element {
  return (
    <AuthPageWrapper>
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        forceRedirectUrl="/auth/sso-callback"
      />
    </AuthPageWrapper>
  );
}
