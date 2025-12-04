/**
 * Auth Skeleton Screens
 * Progressive loading components for auth pages
 * Uses shimmer animation for visual feedback
 */

import { SkeletonList } from "@/components/ui/primitives";

/**
 * Sign-in form skeleton
 */
export function SignInSkeleton() {
  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />

      <div className="w-full max-w-sm space-y-8">
        {/* Title skeleton */}
        <div className="space-y-2 text-center">
          <div className="h-7 bg-primary/15 rounded-lg animate-pulse mx-auto w-32"></div>
          <div className="h-4 bg-primary/15 rounded-lg animate-pulse mx-auto w-24"></div>
        </div>

        {/* Form skeleton */}
        <div className="space-y-2">
          {/* Email field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-12"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-16"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Remember me + forgot password */}
          <div className="h-4 bg-primary/15 rounded animate-pulse w-48"></div>

          {/* Submit button */}
          <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-muted/50 flex-1"></div>
            <div className="h-4 bg-primary/15 rounded animate-pulse w-12"></div>
            <div className="h-px bg-primary/15 flex-1"></div>
          </div>

          {/* Social buttons */}
          <SkeletonList
            count={3}
            spacing="space-y-1.5"
            height="h-9"
            className="bg-primary/15"
          />

          {/* Sign up link */}
          <div className="h-4 bg-primary/15 rounded animate-pulse w-40 mx-auto"></div>
        </div>
      </div>
    </>
  );
}

/**
 * Sign-up form skeleton
 */
export function SignUpSkeleton() {
  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />

      <div className="w-full max-w-sm space-y-8">
        {/* Title skeleton */}
        <div className="space-y-2 text-center">
          <div className="h-7 bg-primary/15 rounded-lg animate-pulse mx-auto w-32"></div>
          <div className="h-4 bg-primary/15 rounded-lg animate-pulse mx-auto w-24"></div>
        </div>

        {/* Form skeleton */}
        <div className="space-y-2">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="h-4 bg-primary/15 rounded animate-pulse w-10"></div>
              <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="h-4 bg-primary/15 rounded animate-pulse w-12"></div>
              <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-10"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Username field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-20"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-16"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Password strength */}
          <div className="h-4 bg-primary/15 rounded animate-pulse w-full"></div>

          {/* Submit button */}
          <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-muted/50 flex-1"></div>
            <div className="h-4 bg-primary/15 rounded animate-pulse w-12"></div>
            <div className="h-px bg-primary/15 flex-1"></div>
          </div>

          {/* Social buttons */}
          <SkeletonList
            count={3}
            spacing="space-y-1.5"
            height="h-9"
            className="bg-primary/15"
          />

          {/* Sign in link */}
          <div className="h-4 bg-primary/15 rounded animate-pulse w-40 mx-auto"></div>
        </div>
      </div>
    </>
  );
}

/**
 * Verification code form skeleton
 */
export function VerificationSkeleton() {
  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />

      <div className="w-full max-w-sm space-y-8">
        {/* Title skeleton */}
        <div className="space-y-2 text-center">
          <div className="h-7 bg-primary/15 rounded-lg animate-pulse mx-auto w-32"></div>
        </div>

        {/* Form skeleton */}
        <div className="space-y-3">
          {/* Info text */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-primary/15 rounded animate-pulse w-5/6"></div>
          </div>

          {/* Code field */}
          <div className="space-y-1">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-20"></div>
            <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>
          </div>

          {/* Submit button */}
          <div className="h-9 bg-primary/15 rounded-lg animate-pulse"></div>

          {/* Back and resend buttons */}
        <div className="flex items-center justify-between gap-2">
            <div className="h-4 bg-primary/15 rounded animate-pulse w-16"></div>
            <div className="h-4 bg-primary/15 rounded animate-pulse w-24"></div>
          </div>
        </div>
      </div>
    </>
  );
}
