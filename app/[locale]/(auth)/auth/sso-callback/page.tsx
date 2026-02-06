'use client';

import { Loader2 } from 'lucide-react';
import { AuthCard } from '@/features/auth';
import { authStyles } from '@/features/auth/theme/auth-styles';
import OnboardingModal from '@/components/shared/onboarding-modal';
import { useSSOCallback } from '@/features/auth/hooks/use-sso-callback';

export default function SSOCallback() {
  const { viewState, onboardingError, handleOnboardingComplete } = useSSOCallback();

  if (viewState.type === 'onboarding') {
    return (
      <OnboardingModal
        categories={viewState.categories}
        categoriesLoading={false}
        loading={false}
        error={onboardingError}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  const loadingMessage =
    viewState.type === 'checking'
      ? 'Verifica account in corso...'
      : viewState.type === 'submitting'
        ? 'Configurazione account...'
        : viewState.type === 'redirecting'
          ? 'Reindirizzamento...'
          : viewState.type === 'error'
            ? viewState.message
            : 'Caricamento...';

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard
        title={viewState.type === 'error' ? 'Errore' : 'Verifica in corso'}
        subtitle={
          viewState.type === 'error'
            ? 'Si è verificato un problema'
            : 'Completamento autenticazione'
        }
      >
        <div className={authStyles.loading.container}>
          <Loader2 className={authStyles.loading.spinner} />
          <p className={authStyles.loading.text}>{loadingMessage}</p>
        </div>
      </AuthCard>
    </>
  );
}
