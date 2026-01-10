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
              <div className={authStyles.loading.container}>
                <Loader2 className={authStyles.loading.spinner} />
                <p className={authStyles.loading.text}>Caricamento in corso...</p>
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
