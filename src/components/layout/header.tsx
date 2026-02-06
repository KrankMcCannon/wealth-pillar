'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings, Bell, Crown } from 'lucide-react';
import { cn } from '@/lib';
import { headerStyles } from './theme/header-styles';
import { ActionMenu } from './action-menu';

// UI Components
import { Button, ThemeToggle } from '@/components/ui';

// Constants
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stickyHeaderStyles } from '@/styles/system';

interface HeaderProps {
  // Navigation & Display
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  isDashboard?: boolean;
  className?: string;

  // User info for display only
  currentUser?: {
    name?: string;
    role?: string;
  };

  // Show action menu
  showActions?: boolean;

  // Extra menu items (optional)
  extraMenuItems?: { label: string; icon: React.ElementType; onClick: () => void }[];

  // Investment data for header badge
  investmentSummary?: {
    totalReturnPercent: number;
  } | null;

  // Callbacks
  onBack?: () => void;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  isDashboard = false,
  className,
  currentUser,
  showActions = false,
  extraMenuItems = [],
  investmentSummary,
  onBack,
}: Readonly<HeaderProps>) {
  const router = useRouter();
  const t = useTranslations('Header');

  // Navigation Handler
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(STICKY_HEADER_BASE, stickyHeaderStyles.base, headerStyles.container, className)}
    >
      <div className={headerStyles.inner}>
        {/* LEFT SECTION: Back Button or Dashboard Info */}
        <div className={headerStyles.left}>
          {isDashboard && currentUser && (
            <>
              <div className={headerStyles.dashboard.wrapper}>
                <div className={headerStyles.dashboard.avatarWrap}>
                  <div className={headerStyles.dashboard.avatar}>
                    {currentUser?.name?.substring(0, 2).toUpperCase()}
                  </div>
                  {currentUser?.role === 'admin' && (
                    <div
                      className={headerStyles.dashboard.crownWrap}
                      title={t('premiumBadgeTitle')}
                    >
                      <Crown className={headerStyles.dashboard.crownIcon} />
                    </div>
                  )}
                </div>
                <div className={headerStyles.dashboard.userInfo}>
                  <p className={headerStyles.dashboard.userName}>{currentUser?.name}</p>
                  <p className={headerStyles.dashboard.userRole}>
                    {currentUser?.role === 'admin' ? t('plans.premium') : t('plans.standard')}
                  </p>
                </div>
              </div>

              {investmentSummary && (
                <div
                  className={cn(
                    headerStyles.actions.badge,
                    investmentSummary.totalReturnPercent >= 0
                      ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                  )}
                >
                  <span>
                    {investmentSummary.totalReturnPercent >= 0 ? '↗' : '↘'}{' '}
                    {investmentSummary.totalReturnPercent >= 0 ? '+' : ''}
                    {investmentSummary.totalReturnPercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </>
          )}

          {!isDashboard && (
            // Subpage View: Back Button & Title
            <div className={headerStyles.subpage.wrapper}>
              {showBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('aria.back')}
                  className={headerStyles.subpage.backButton}
                  onClick={handleBack}
                >
                  <ArrowLeft className={headerStyles.subpage.backIcon} />
                </Button>
              )}
              <div>
                {title && <h1 className={headerStyles.subpage.title}>{title}</h1>}
                {subtitle && <p className={headerStyles.subpage.subtitle}>{subtitle}</p>}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Actions */}
        <div className={headerStyles.actions.wrapper}>
          {/* 1. Add Actions */}
          {showActions && (
            <ActionMenu
              extraMenuItems={extraMenuItems}
              triggerClassName={cn(headerStyles.actions.actionButton, 'hidden md:inline-flex')}
              triggerIconClassName={headerStyles.actions.actionIcon}
              menuClassName={headerStyles.actions.menu}
            />
          )}

          {/* 2. Notifications */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('aria.notifications')}
            className={headerStyles.actions.iconButton}
          >
            <Bell className={headerStyles.actions.icon} />
          </Button>

          {/* 3. Settings */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('aria.settings')}
            className={headerStyles.actions.iconButton}
            onClick={() => router.push('/settings')}
          >
            <Settings className={headerStyles.actions.icon} />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
