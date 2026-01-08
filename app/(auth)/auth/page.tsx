import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthCard, authStyles } from "@/features/auth";
import AuthContent from "./auth-content";

/**
 * Unified Authentication Page
 * Main entry point for OAuth authentication
 */
export default function Page() {
  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <div className={authStyles.page.container}>
        <Suspense
          fallback={
            <AuthCard title="Caricamento..." subtitle="Un attimo di pazienza">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--color-primary))]" />
                <p className="text-sm text-gray-600 text-center">Caricamento in corso...</p>
              </div>
            </AuthCard>
          }
        >
          <AuthContent />
        </Suspense>
      </div>
    </>
  );
}
