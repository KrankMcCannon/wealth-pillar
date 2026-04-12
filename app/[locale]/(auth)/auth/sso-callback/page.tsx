'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/features/auth';
import { authStyles } from '@/features/auth/theme/auth-styles';
import { useSSOCallback } from '@/features/auth/hooks/use-sso-callback';
import { Link } from '@/i18n/routing';

export default function SSOCallbackPage(): React.JSX.Element {
  const t = useTranslations('Auth.ssoCallback');
  const { viewState, retry } = useSSOCallback();

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

  const title = viewState.type === 'redirecting' ? t('titleRedirecting') : t('loadingTitle');
  const subtitle = viewState.type === 'redirecting' ? t('subtitleRedirecting') : t('verifying');
  const loadingMessage =
    viewState.type === 'checking'
      ? t('checking')
      : viewState.type === 'redirecting'
        ? t('redirecting')
        : t('checking');

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard title={title} subtitle={subtitle}>
        <div className={authStyles.loading.container}>
          <Loader2 className={authStyles.loading.spinner} />
          <p className={authStyles.loading.text}>{loadingMessage}</p>
        </div>
      </AuthCard>
    </>
  );
}
