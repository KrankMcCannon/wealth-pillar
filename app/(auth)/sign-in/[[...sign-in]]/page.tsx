import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/features/auth/theme/clerk-appearance";
import { AuthPageWrapper } from "@/features/auth";

export default function SignInPage() {
  return (
    <AuthPageWrapper>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl="/auth/sso-callback"
      />
    </AuthPageWrapper>
  );
}
