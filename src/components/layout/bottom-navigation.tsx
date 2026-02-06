'use client';

import { Link, usePathname } from '@/i18n/routing';
import { Home, CreditCard, TrendingUp, BarChart3 } from 'lucide-react';
import { bottomNavigationStyles } from './theme/bottom-navigation-styles';

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/home',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/transactions',
      icon: CreditCard,
      label: 'Transactions',
    },
    {
      href: '/investments',
      icon: TrendingUp,
      label: 'Investments',
    },
    {
      href: '/reports',
      icon: BarChart3,
      label: 'Reports',
    },
  ];

  return (
    <div className={bottomNavigationStyles.container}>
      <div className={bottomNavigationStyles.inner}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${bottomNavigationStyles.item} ${
                isActive ? bottomNavigationStyles.itemActive : bottomNavigationStyles.itemInactive
              }`}
            >
              <IconComponent className={bottomNavigationStyles.icon} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
