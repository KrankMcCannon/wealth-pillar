'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  CreditCard,
  PieChart,
  Plus,
  RefreshCw,
  Tag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib';
import { useModalState } from '@/lib/navigation/url-state';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  /** Override default aria-label (e.g. shorter label under bottom nav FAB). */
  triggerAriaLabel?: string;
  /**
   * Bottom nav: 3 azioni principali; le altre dietro una riga espandibile (secondo tap).
   */
  groupedSecondary?: boolean;
}

function renderMenuItem(item: MenuItem) {
  return (
    <DropdownMenuItem key={item.label} onSelect={() => item.onClick()}>
      <item.icon className="mr-2 h-4 w-4 shrink-0" />
      {item.label}
    </DropdownMenuItem>
  );
}

export function ActionMenu({
  extraMenuItems = [],
  triggerClassName,
  triggerIconClassName,
  menuClassName,
  align = 'end',
  reverseMobileOrder = false,
  triggerAriaLabel,
  groupedSecondary = false,
}: Readonly<ActionMenuProps>) {
  const t = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  /** Stesso ordine di priorità del menu raggruppato (allineato header ↔ bottom nav). */
  const actionItems: MenuItem[] = [
    ...extraMenuItems,
    { label: t('newTransaction'), icon: CreditCard, onClick: () => openModal('transaction') },
    { label: t('newBudget'), icon: PieChart, onClick: () => openModal('budget') },
    { label: t('newAccount'), icon: Wallet, onClick: () => openModal('account') },
    { label: t('newCategory'), icon: Tag, onClick: () => openModal('category') },
    { label: t('newInvestment'), icon: TrendingUp, onClick: () => openModal('investment') },
    { label: t('recurring'), icon: RefreshCw, onClick: () => openModal('recurring') },
  ];

  const displayItems = reverseMobileOrder && isMobile ? [...actionItems].reverse() : actionItems;

  const primaryWhenGrouped: MenuItem[] = [
    { label: t('newTransaction'), icon: CreditCard, onClick: () => openModal('transaction') },
    { label: t('newBudget'), icon: PieChart, onClick: () => openModal('budget') },
    { label: t('newAccount'), icon: Wallet, onClick: () => openModal('account') },
  ];

  const secondaryWhenGrouped: MenuItem[] = [
    { label: t('newCategory'), icon: Tag, onClick: () => openModal('category') },
    { label: t('newInvestment'), icon: TrendingUp, onClick: () => openModal('investment') },
    { label: t('recurring'), icon: RefreshCw, onClick: () => openModal('recurring') },
  ];

  const contentPositionProps = groupedSecondary
    ? { align: 'center' as const, collisionPadding: 24, side: 'top' as const, sideOffset: 10 }
    : { align, collisionPadding: 16, sideOffset: 4 };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setSecondaryOpen(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          id="global-action-menu-trigger"
          variant="default"
          size="icon"
          aria-label={triggerAriaLabel ?? t('openMenuAria')}
          className={triggerClassName}
        >
          <Plus className={cn('h-5 w-5', triggerIconClassName)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuClassName} {...contentPositionProps}>
        {groupedSecondary ? (
          <>
            {extraMenuItems.map(renderMenuItem)}
            {extraMenuItems.length > 0 ? <DropdownMenuSeparator /> : null}
            {primaryWhenGrouped.map(renderMenuItem)}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              aria-expanded={secondaryOpen}
              className="text-muted-foreground focus:text-foreground"
              onSelect={(e) => {
                e.preventDefault();
                setSecondaryOpen((v) => !v);
              }}
            >
              <span className="flex w-full min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 text-left font-medium">
                  {secondaryOpen ? t('showLessActions') : t('moreActions')}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 motion-reduce:transition-none',
                    secondaryOpen && 'rotate-180'
                  )}
                />
              </span>
            </DropdownMenuItem>
            {secondaryOpen ? secondaryWhenGrouped.map(renderMenuItem) : null}
          </>
        ) : (
          displayItems.map(renderMenuItem)
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
