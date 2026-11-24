'use client';

import { useLinkStatus } from 'next/link';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Home, CreditCard, TrendingUp, BarChart3, Wallet, type LucideIcon } from 'lucide-react';
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
        const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const label = t(item.labelKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={shell.bottomNavItem}
            aria-current={isCurrent ? 'page' : undefined}
            title={label}
          >
            <BottomNavItemChrome Icon={item.icon} label={label} isCurrent={isCurrent} />
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNavItemChrome({
  Icon,
  label,
  isCurrent,
}: Readonly<{
  Icon: LucideIcon;
  label: string;
  isCurrent: boolean;
}>) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span
        className={cn(
          'relative',
          shell.bottomNavIconWell,
          isCurrent && shell.bottomNavIconWellActive
        )}
        aria-busy={pending || undefined}
      >
        <Icon className={shell.bottomNavIcon} aria-hidden />
        {pending ? (
          <span
            className="absolute right-0 top-0 size-2 rounded-full bg-primary ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </span>
      <span className={cn(shell.bottomNavLabel, isCurrent && shell.bottomNavLabelActive)}>
        {label}
      </span>
    </>
  );
}
