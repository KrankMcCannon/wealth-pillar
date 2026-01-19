import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/features/auth/theme/clerk-appearance";
import { authStyles } from "@/features/auth/theme/auth-styles";

export default function SignUpPage() {
  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <div className="flex w-full justify-center py-12 relative z-10">
        <SignUp
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          forceRedirectUrl="/auth/sso-callback"
        />
      </div>
    </>
  );
}
