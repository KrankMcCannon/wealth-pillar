'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Home, CreditCard, TrendingUp, BarChart3, Wallet } from 'lucide-react';
import { cn } from '@/lib';
import { stitchDashboardShell as shell } from '@/styles/home-design-foundation';

const NAV_ITEMS = [
  { href: '/home', icon: Home, labelKey: 'home' as const },
  { href: '/transactions', icon: CreditCard, labelKey: 'transactions' as const },
  { href: '/budgets', icon: Wallet, labelKey: 'budgets' as const },
  { href: '/investments', icon: TrendingUp, labelKey: 'investments' as const },
  { href: '/reports', icon: BarChart3, labelKey: 'reports' as const },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations('BottomNav');

  return (
    <nav
      className={cn(shell.bottomBar, shell.bottomBarPad, shell.bottomNav)}
      aria-label={t('ariaNav')}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const label = t(item.labelKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(shell.bottomNavItem, isActive && shell.bottomNavItemActive)}
            aria-current={isActive ? 'page' : undefined}
            title={label}
          >
            <span
              className={cn(shell.bottomNavIconWell, isActive && shell.bottomNavIconWellActive)}
            >
              <Icon className={shell.bottomNavIcon} aria-hidden />
            </span>
            <span className={cn(shell.bottomNavLabel, isActive && shell.bottomNavLabelActive)}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
