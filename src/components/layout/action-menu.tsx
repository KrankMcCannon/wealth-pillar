'use client';

import { useTranslations } from 'next-intl';
import { CreditCard, PieChart, Plus, RefreshCw, Tag, TrendingUp } from 'lucide-react';
import { cn } from '@/lib';
import { useModalState } from '@/lib/navigation/url-state';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

type MenuItem = {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
};

interface ActionMenuProps {
  extraMenuItems?: MenuItem[];
  triggerClassName?: string;
  triggerIconClassName?: string;
  menuClassName?: string;
  align?: 'start' | 'center' | 'end';
  reverseMobileOrder?: boolean;
}

export function ActionMenu({
  extraMenuItems = [],
  triggerClassName,
  triggerIconClassName,
  menuClassName,
  align = 'end',
  reverseMobileOrder = false,
}: Readonly<ActionMenuProps>) {
  const t = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const actionItems: MenuItem[] = [
    ...extraMenuItems,
    { label: t('newBudget'), icon: PieChart, onClick: () => openModal('budget') },
    { label: t('newAccount'), icon: CreditCard, onClick: () => openModal('account') },
    { label: t('newCategory'), icon: Tag, onClick: () => openModal('category') },
    { label: t('newInvestment'), icon: TrendingUp, onClick: () => openModal('investment') },
    { label: t('recurring'), icon: RefreshCw, onClick: () => openModal('recurring') },
    { label: t('newTransaction'), icon: CreditCard, onClick: () => openModal('transaction') },
  ];

  // Determine items based on viewport and requested reverse behavior
  const displayItems = reverseMobileOrder && isMobile ? [...actionItems].reverse() : actionItems;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="global-action-menu-trigger"
          variant="default"
          size="icon"
          aria-label={t('openMenuAria')}
          className={triggerClassName}
        >
          <Plus className={cn('h-5 w-5', triggerIconClassName)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={menuClassName}>
        {displayItems.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
