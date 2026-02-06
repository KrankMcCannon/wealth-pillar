'use client';

import { useTranslations } from 'next-intl';
import { pageLoaderStyles } from './theme/page-loader-styles';

interface PageLoaderProps {
  message?: string;
  submessage?: string;
}

export function PageLoader({ message, submessage }: Readonly<PageLoaderProps>) {
  const t = useTranslations('Common.PageLoader');
  const resolvedMessage = message ?? t('message');
  const resolvedSubmessage = submessage ?? t('submessage');

  return (
    <div className={pageLoaderStyles.page}>
      <div className={pageLoaderStyles.container}>
        <div className={pageLoaderStyles.content}>
          <div className={pageLoaderStyles.iconWrap}>
            <svg
              className={pageLoaderStyles.icon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className={pageLoaderStyles.message}>{resolvedMessage}</p>
          <p className={pageLoaderStyles.submessage}>{resolvedSubmessage}</p>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
