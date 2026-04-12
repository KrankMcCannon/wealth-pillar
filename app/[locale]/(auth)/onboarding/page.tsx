'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/features/auth';
import { authStyles } from '@/features/auth/theme/auth-styles';
import OnboardingModal from '@/components/shared/onboarding-modal';
import { useOnboardingPage } from '@/features/auth/hooks/use-onboarding-page';
import { Link } from '@/i18n/routing';

/**
 * Wizard onboarding dopo OAuth: separato da `/auth/sso-callback` per macchina a stati più semplice
 * e navigazione `refresh` + `replace` affidabile dopo `completeOnboardingAction`.
 */
export default function OnboardingPage(): React.JSX.Element {
  const t = useTranslations('Auth.ssoCallback');
  const { userId } = useAuth();
  const { phase, handleComplete } = useOnboardingPage();

  if (phase.type === 'error') {
    return (
      <>
        <div className={authStyles.page.bgBlobTop} />
        <div className={authStyles.page.bgBlobBottom} />
        <AuthCard title={t('errorTitle')} subtitle={t('errorSubtitle')}>
          <div className={authStyles.errorPage.container}>
            <p className={authStyles.errorPage.description}>{phase.message}</p>
            <Link href="/sign-in" className={authStyles.errorPage.backLink}>
              {t('backToLogin')}
            </Link>
          </div>
        </AuthCard>
      </>
    );
  }

  if (phase.type === 'ready') {
    return (
      <OnboardingModal
        userId={userId ?? null}
        categories={phase.categories}
        categoriesLoading={false}
        loading={false}
        error={null}
        onComplete={handleComplete}
      />
    );
  }

  if (phase.type === 'submitting') {
    return (
      <>
        <div className={authStyles.page.bgBlobTop} />
        <div className={authStyles.page.bgBlobBottom} />
        <AuthCard title={t('loadingTitle')} subtitle={t('verifying')}>
          <div className={authStyles.loading.container}>
            <Loader2 className={authStyles.loading.spinner} />
            <p className={authStyles.loading.text}>{t('submitting')}</p>
          </div>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard title={t('loadingTitle')} subtitle={t('verifying')}>
        <div className={authStyles.loading.container}>
          <Loader2 className={authStyles.loading.spinner} />
          <p className={authStyles.loading.text}>{t('checking')}</p>
        </div>
      </AuthCard>
    </>
  );
}
