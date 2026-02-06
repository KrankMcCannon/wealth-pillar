'use client';

import { Link, usePathname } from '@/i18n/routing';
import { BarChart3, CreditCard, Home, PiggyBank, Settings, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui';
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
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={`${desktopSidebarStyles.navItem} ${
                isActive ? desktopSidebarStyles.navItemActive : desktopSidebarStyles.navItemInactive
              }`}
            >
              <Link href={item.href}>
                <Icon className={desktopSidebarStyles.navItemIcon} />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className={desktopSidebarStyles.footer}>
        <Button
          asChild
          variant="ghost"
          className={`${desktopSidebarStyles.navItem} ${
            isSettingsActive
              ? desktopSidebarStyles.navItemActive
              : desktopSidebarStyles.navItemInactive
          }`}
        >
          <Link href="/settings">
            <Settings className={desktopSidebarStyles.navItemIcon} />
            <span>Settings</span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}
