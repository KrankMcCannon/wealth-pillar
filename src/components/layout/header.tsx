'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { headerStyles } from './theme/header-styles';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  isDashboard?: boolean;
  className?: string;
  onBack?: () => void;
}

export function Header({
  title,
  showBack = false,
  isDashboard = false,
  className,
  onBack,
}: Readonly<HeaderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Header');

  const pathSegments = pathname.split('/').filter(Boolean);
  const isSettingsPage = pathSegments[pathSegments.length - 1] === 'settings';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container, className)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          {showBack ? (
            <button
              type="button"
              aria-label={t('aria.back')}
              className={headerStyles.backButton}
              onClick={handleBack}
            >
              <ArrowLeft className={headerStyles.backIcon} />
            </button>
          ) : null}
        </div>

        <div className={headerStyles.slotCenter}>
          <div>
            <h1 className={isDashboard ? headerStyles.appName : headerStyles.pageTitle}>
              {isDashboard ? t('appName') : title}
            </h1>
          </div>
        </div>

        <div className={headerStyles.slotRight}>
          {!isSettingsPage && (
            <button
              type="button"
              aria-label={t('aria.settings')}
              className={headerStyles.iconButton}
              onClick={() => router.push('/settings')}
            >
              <Settings className={headerStyles.icon} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
