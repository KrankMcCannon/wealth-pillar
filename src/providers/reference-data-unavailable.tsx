'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { ReactNode } from 'react';

/** Keep the shell and any existing catalog usable when a refresh fails. */
export function ReferenceDataUnavailable({ children }: { children: ReactNode }) {
  const t = useTranslations('FormStatus');
  const router = useRouter();
  return (
    <>
      <div role="alert" className="border-b border-border bg-background p-3 text-sm">
        {t('referenceUnavailable')}{' '}
        <button type="button" className="underline" onClick={() => router.refresh()}>
          {t('retry')}
        </button>
      </div>
      {children}
    </>
  );
}
