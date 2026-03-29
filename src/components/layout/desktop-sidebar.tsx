'use client';

import { Link, usePathname } from '@/i18n/routing';
import { BarChart3, CreditCard, Home, PiggyBank, Settings, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonStyles } from '@/styles/system';
import { desktopSidebarStyles } from './theme/desktop-sidebar-styles';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/transactions', icon: CreditCard, label: 'Transactions' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/investments', icon: TrendingUp, label: 'Investments' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();

  const isAuthRoute =
    pathname === '/sign-in' ||
    pathname.startsWith('/sign-in/') ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-up/') ||
    pathname === '/error' ||
    pathname.startsWith('/error/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/');

  if (isAuthRoute) return null;

  const isSettingsActive = pathname === '/settings' || pathname.startsWith('/settings/');

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className={desktopSidebarStyles.container}>
      <div className={desktopSidebarStyles.brandSection}>
        <p className={desktopSidebarStyles.brandEyebrow}>Workspace</p>
        <p className={desktopSidebarStyles.brandTitle}>Wealth Pillar</p>
      </div>

      <nav className={desktopSidebarStyles.nav} aria-label="Desktop Navigation">
        {navItems.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                buttonStyles.base,
                'justify-start no-underline',
                desktopSidebarStyles.navItem,
                isActive ? desktopSidebarStyles.navItemActive : desktopSidebarStyles.navItemInactive
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={desktopSidebarStyles.navItemIcon} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={desktopSidebarStyles.footer}>
        <Link
          href="/settings"
          prefetch
          className={cn(
            buttonStyles.base,
            'justify-start no-underline',
            desktopSidebarStyles.navItem,
            isSettingsActive
              ? desktopSidebarStyles.navItemActive
              : desktopSidebarStyles.navItemInactive
          )}
          aria-current={isSettingsActive ? 'page' : undefined}
        >
          <Settings className={desktopSidebarStyles.navItemIcon} aria-hidden />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
