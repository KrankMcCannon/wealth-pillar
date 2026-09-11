'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';

const headerStyles = {
  container: 'px-4 py-2',
  inner: 'flex min-h-11 items-center gap-1',
  title: 'min-w-0 flex-1 truncate text-base font-semibold text-foreground',
  titleSkeleton: 'block h-5 w-36 max-w-[70%] rounded-md bg-muted',
  iconButton:
    'flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  icon: 'h-5 w-5',
} as const;

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  className?: string;
  onBack?: () => void;
  ready?: boolean;
}

export function Header({
  title,
  showBack = false,
  className,
  onBack,
  ready = true,
}: Readonly<HeaderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Header');

  const pathSegments = pathname.split('/').filter(Boolean);
  const isSettingsPage = pathSegments[pathSegments.length - 1] === 'settings';
  const heading = title?.trim() ? title : t('appName');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(STICKY_HEADER_BASE, headerStyles.container, className)}
      aria-busy={ready ? undefined : true}
    >
      <div className={headerStyles.inner}>
        {showBack ? (
          <button
            type="button"
            aria-label={t('aria.back')}
            className={headerStyles.iconButton}
            onClick={handleBack}
          >
            <ArrowLeft className={headerStyles.icon} />
          </button>
        ) : (
          <span className="min-h-11 min-w-11 shrink-0" aria-hidden />
        )}

        {ready ? (
          <h1 className={headerStyles.title}>{heading}</h1>
        ) : (
          <span className="min-w-0 flex-1">
            <span className={headerStyles.titleSkeleton} aria-hidden />
          </span>
        )}

        {!isSettingsPage ? (
          <button
            type="button"
            aria-label={t('aria.settings')}
            className={headerStyles.iconButton}
            onClick={() => router.push('/settings')}
          >
            <Settings className={headerStyles.icon} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
