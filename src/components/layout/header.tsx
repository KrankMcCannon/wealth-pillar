'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { headerStyles } from './theme/header-styles';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  isDashboard?: boolean;
  className?: string;
  currentUser?: { name?: string; role?: string };
  onAvatarClick?: (() => void) | undefined;
  /** Kept for API compatibility — no longer rendered (was desktop-only). */
  showActions?: boolean;
  onBack?: () => void;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  isDashboard = false,
  className,
  currentUser,
  onAvatarClick,
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
        {/* LEFT */}
        <div className={headerStyles.slotLeft}>
          {isDashboard ? (
            <button
              type="button"
              onClick={onAvatarClick}
              disabled={!onAvatarClick}
              aria-label={t('aria.userPicker')}
              className={cn(headerStyles.avatarButton, !onAvatarClick && 'cursor-default')}
            >
              <div className={headerStyles.avatar}>
                {currentUser?.name?.substring(0, 2).toUpperCase() ?? '?'}
              </div>
            </button>
          ) : showBack ? (
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

        {/* CENTER */}
        <div className={headerStyles.slotCenter}>
          <div>
            <h1 className={isDashboard ? headerStyles.appName : headerStyles.pageTitle}>
              {isDashboard ? t('appName') : title}
            </h1>
            {subtitle && !isDashboard && <p className={headerStyles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {/* RIGHT */}
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
