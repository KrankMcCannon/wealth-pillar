'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';

const headerStyles = {
  container: 'px-4 py-2',
  inner: 'flex h-11 items-center gap-2',
  slotLeft: 'flex shrink-0 items-center',
  slotCenter: 'flex min-w-0 flex-1 items-center',
  slotRight: 'flex shrink-0 items-center justify-end',
  appName: 'truncate text-base font-semibold text-foreground',
  pageTitle: 'truncate text-base font-semibold text-foreground',
  backButton:
    'flex h-9 w-9 min-h-11 min-w-11 items-center justify-center rounded-full text-foreground/70 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  backIcon: 'h-5 w-5',
  iconButton:
    'flex h-9 w-9 min-h-11 min-w-11 items-center justify-center rounded-full text-foreground/70 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  icon: 'h-5 w-5',
} as const;

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
          <h1 className={isDashboard ? headerStyles.appName : headerStyles.pageTitle}>
            {isDashboard ? t('appName') : title}
          </h1>
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
