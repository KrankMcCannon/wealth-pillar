'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Home, CreditCard, TrendingUp, BarChart3 } from 'lucide-react';
import { bottomNavigationStyles } from './theme/bottom-navigation-styles';
import { ActionMenu } from './action-menu';

export function BottomNavigation() {
  const pathname = usePathname();
  const isAccountsRoute = pathname.includes('/accounts');
  const t = useTranslations('BottomNav');

  const navItems = [
    { href: '/home', icon: Home, labelKey: 'home' as const },
    { href: '/transactions', icon: CreditCard, labelKey: 'transactions' as const },
    { href: '/investments', icon: TrendingUp, labelKey: 'investments' as const },
    { href: '/reports', icon: BarChart3, labelKey: 'reports' as const },
  ];

  return (
    <div className={bottomNavigationStyles.container}>
      <nav className={bottomNavigationStyles.inner} aria-label={t('ariaNav')}>
        {navItems.slice(0, 2).map((item) => {
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

        <div className={bottomNavigationStyles.addColumn}>
          <div className={bottomNavigationStyles.addButtonWrap}>
            <ActionMenu
              align="center"
              groupedSecondary
              triggerClassName={bottomNavigationStyles.addButton}
              triggerIconClassName={bottomNavigationStyles.addIcon}
              menuClassName={bottomNavigationStyles.menu}
              triggerAriaLabel={t('add')}
              triggerTitle={isAccountsRoute ? t('addFabTitleAccounts') : undefined}
            />
          </div>
          <span className={bottomNavigationStyles.addCaption}>{t('add')}</span>
        </div>

        {navItems.slice(2).map((item) => {
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
