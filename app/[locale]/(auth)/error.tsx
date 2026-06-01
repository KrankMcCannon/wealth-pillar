'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { AuthCard, authStyles } from '@/features/auth';
import { Link } from '@/i18n/routing';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  const t = useTranslations('Auth.error');

  useEffect(() => {
    console.error('[Auth Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className={authStyles.page.wrapper}>
      <AuthCard title={t('title')} subtitle={t('subtitle')}>
        <div className={authStyles.errorPage.container}>
          <p className={authStyles.errorPage.description}>
            {error.message || t('fallbackMessage')}
          </p>
          <Button onClick={() => reset()} className="w-full" size="default">
            {t('retry')}
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/sign-in">{t('backToSignIn')}</Link>
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
