'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowLeft, Settings, Bell, Crown, MoreHorizontal, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib';
import { useMounted } from '@/hooks';
import { headerStyles } from './theme/header-styles';
import { ActionMenu } from './action-menu';

import {
  Button,
  ThemeToggle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

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
  investmentSummary?:
    | {
        totalReturnPercent: number;
      }
    | null
    | undefined;

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
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

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
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-destructive/30 bg-destructive/10 text-destructive'
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
          {showActions && (
            <ActionMenu
              extraMenuItems={extraMenuItems}
              triggerClassName={cn(headerStyles.actions.actionButton, 'hidden md:inline-flex')}
              triggerIconClassName={headerStyles.actions.actionIcon}
              menuClassName={headerStyles.actions.menu}
            />
          )}

          {isDashboard ? (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('aria.notifications')}
                  className={headerStyles.actions.iconButton}
                  type="button"
                >
                  <Bell className={headerStyles.actions.icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('aria.settings')}
                  className={headerStyles.actions.iconButton}
                  type="button"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className={headerStyles.actions.icon} />
                </Button>
                <ThemeToggle />
              </div>

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={t('aria.moreMenu')}
                      aria-haspopup="menu"
                      className={headerStyles.actions.iconButton}
                    >
                      <MoreHorizontal className={headerStyles.actions.icon} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      disabled
                      className="opacity-70"
                      title={t('notifications.disabledHint')}
                    >
                      <Bell className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0">{t('aria.notifications')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0">{t('aria.settings')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!mounted}
                      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    >
                      {resolvedTheme === 'dark' ? (
                        <Sun className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      ) : (
                        <Moon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0">
                        {resolvedTheme === 'dark'
                          ? t('theme.switchToLight')
                          : t('theme.switchToDark')}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('aria.notifications')}
                className={headerStyles.actions.iconButton}
                type="button"
              >
                <Bell className={headerStyles.actions.icon} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('aria.settings')}
                className={headerStyles.actions.iconButton}
                type="button"
                onClick={() => router.push('/settings')}
              >
                <Settings className={headerStyles.actions.icon} />
              </Button>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
