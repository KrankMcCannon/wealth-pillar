'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Home, CreditCard, TrendingUp, BarChart3, Wallet } from 'lucide-react';
import { stitchDashboardShell } from '@/styles/home-design-foundation';

const bottomNavigationStyles = {
  container: `${stitchDashboardShell.bottomBar} px-2 pt-1 pb-[calc(theme(spacing.1)+env(safe-area-inset-bottom))]`,
  inner:
    'mx-auto grid max-w-xl grid-cols-5 items-end gap-x-0.5 gap-y-0 overflow-visible px-0.5 pb-0.5 pt-0',
  item: 'relative z-0 flex min-h-11 min-w-0 flex-col items-center justify-end gap-0 rounded-xl px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none active:bg-primary/5',
  itemActive: 'bg-primary/20 text-primary shadow-sm ring-1 ring-inset ring-primary/20',
  itemInactive:
    'text-primary/75 hover:bg-primary/10 hover:text-primary motion-reduce:transition-none',
  icon: 'h-5 w-5 shrink-0',
  caption:
    'min-w-0 max-w-[5.25rem] text-center text-[clamp(0.625rem,2.6vw,0.75rem)] font-medium leading-none text-current [overflow-wrap:anywhere]',
  addColumn:
    'relative z-10 flex flex-col items-center justify-end gap-0 justify-self-center overflow-visible pb-0 text-primary/75',
  addButtonWrap: '-mb-[1.375rem] flex justify-center sm:-mb-6',
  addButton:
    'h-11 w-11 min-h-11 min-w-11 -translate-y-[1.375rem] rounded-full border-[3px] border-background bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-12 sm:w-12 sm:min-h-12 sm:min-w-12 sm:-translate-y-6 sm:border-4',
  addIcon: 'h-5 w-5 sm:h-6 sm:w-6',
  addCaption:
    'min-w-0 max-w-[5.25rem] text-center text-[clamp(0.625rem,2.6vw,0.75rem)] font-medium leading-none text-current [overflow-wrap:anywhere]',
  menu: 'w-56 max-w-[calc(100vw-2rem)]',
} as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations('BottomNav');

  const navItems = [
    { href: '/home', icon: Home, labelKey: 'home' as const },
    { href: '/transactions', icon: CreditCard, labelKey: 'transactions' as const },
    { href: '/budgets', icon: Wallet, labelKey: 'budgets' as const },
    { href: '/investments', icon: TrendingUp, labelKey: 'investments' as const },
    { href: '/reports', icon: BarChart3, labelKey: 'reports' as const },
  ];

  return (
    <div className={bottomNavigationStyles.container}>
      <nav className={bottomNavigationStyles.inner} aria-label={t('ariaNav')}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${bottomNavigationStyles.item} ${
                isActive ? bottomNavigationStyles.itemActive : bottomNavigationStyles.itemInactive
              }`}
              aria-current={isActive ? 'page' : undefined}
              title={label}
            >
              <IconComponent className={bottomNavigationStyles.icon} aria-hidden />
              <span className={bottomNavigationStyles.caption}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
