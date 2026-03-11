'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/features/auth';
import { authStyles } from '@/features/auth/theme/auth-styles';
import OnboardingModal from '@/components/shared/onboarding-modal';
import { useSSOCallback } from '@/features/auth/hooks/use-sso-callback';
import { Link } from '@/i18n/routing';

export default function SSOCallback() {
  const t = useTranslations('Auth.ssoCallback');
  const { viewState, onboardingError, handleOnboardingComplete, retry } = useSSOCallback();

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

  if (viewState.type === 'error') {
    return (
      <>
        <div className={authStyles.page.bgBlobTop} />
        <div className={authStyles.page.bgBlobBottom} />
        <AuthCard title={t('errorTitle')} subtitle={t('errorSubtitle')}>
          <div className={authStyles.errorPage.container}>
            <p className={authStyles.errorPage.description}>{viewState.message}</p>
            <button type="button" className={authStyles.errorPage.retryButton} onClick={retry}>
              {t('retry')}
            </button>
            <Link href="/sign-in" className={authStyles.errorPage.backLink}>
              {t('backToLogin')}
            </Link>
          </div>
        </AuthCard>
      </>
    );
  }

  const loadingMessage =
    viewState.type === 'checking'
      ? t('checking')
      : viewState.type === 'submitting'
        ? t('submitting')
        : viewState.type === 'redirecting'
          ? t('redirecting')
          : 'Caricamento...';

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard title={t('loadingTitle')} subtitle={t('verifying')}>
        <div className={authStyles.loading.container}>
          <Loader2 className={authStyles.loading.spinner} />
          <p className={authStyles.loading.text}>{loadingMessage}</p>
        </div>
      </AuthCard>
    </>
  );
}
