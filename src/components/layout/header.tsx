'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Settings,
  Bell,
  Plus,
  CreditCard,
  PieChart,
  Tag,
  RefreshCw,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib';
import { headerStyles } from './theme/header-styles';

// UI Components
import {
  Button,
  ThemeToggle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

// New Modal State Management
import { useModalState } from '@/lib/navigation/url-state';

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

// Action Menu Component - Separate to avoid hook issues when NuqsAdapter isn't available
function ActionMenu({
  extraMenuItems = [],
}: Readonly<{
  extraMenuItems?: { label: string; icon: React.ElementType; onClick: () => void }[];
}>) {
  const t = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();

  const actionItems = [
    ...extraMenuItems,
    {
      label: t('newBudget'),
      icon: PieChart,
      onClick: () => openModal('budget'),
    },
    {
      label: t('newAccount'),
      icon: CreditCard,
      onClick: () => openModal('account'),
    },
    {
      label: t('newCategory'),
      icon: Tag,
      onClick: () => openModal('category'),
    },
    {
      label: t('newInvestment'),
      icon: TrendingUp,
      onClick: () => openModal('investment'),
    },
    {
      label: t('recurring'),
      icon: RefreshCw,
      onClick: () => openModal('recurring'),
    },
    {
      label: t('newTransaction'),
      icon: CreditCard,
      onClick: () => openModal('transaction'),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="header-action-menu-trigger"
          variant="default"
          size="icon"
          aria-label={t('openMenuAria')}
          className={headerStyles.actions.actionButton}
        >
          <Plus className={headerStyles.actions.actionIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={headerStyles.actions.menu}>
        {actionItems.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            <item.icon className={headerStyles.actions.menuIcon} />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
          {showActions && <ActionMenu extraMenuItems={extraMenuItems} />}

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
