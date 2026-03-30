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
import { useMounted } from '@/hooks/use-mounted';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

const FAB_INTRO_STORAGE_KEY = 'wp-fab-menu-intro-v1';

export type ActionMenuItem = {
  label: string;
  /** Testo tooltip / title nativo (opzionale per voci extra da header). */
  hint?: string | undefined;
  icon: React.ElementType;
  onClick: () => void;
};

interface ActionMenuProps {
  extraMenuItems?: ActionMenuItem[];
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

function renderMenuItem(item: ActionMenuItem) {
  return (
    <DropdownMenuItem
      key={item.label}
      title={item.hint}
      onSelect={() => item.onClick()}
      className="min-h-11"
    >
      <item.icon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 text-left">{item.label}</span>
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
  const mounted = useMounted();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabIntroDismissed, setFabIntroDismissed] = useState(false);
  const [showFabIntro, setShowFabIntro] = useState(false);
  const fabIntroEligible =
    mounted &&
    !fabIntroDismissed &&
    (() => {
      try {
        return localStorage.getItem(FAB_INTRO_STORAGE_KEY) !== '1';
      } catch {
        return false;
      }
    })();

  const handleOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (!open) {
      setSecondaryOpen(false);
      if (showFabIntro) {
        try {
          localStorage.setItem(FAB_INTRO_STORAGE_KEY, '1');
        } catch {
          /* private mode / quota */
        }
        setFabIntroDismissed(true);
        setShowFabIntro(false);
      }
    } else if (groupedSecondary && fabIntroEligible) {
      setShowFabIntro(true);
    }
  };

  /** Stesso ordine di priorità del menu raggruppato (allineato header ↔ bottom nav). */
  const actionItems: ActionMenuItem[] = [
    ...extraMenuItems,
    {
      label: t('newTransaction'),
      hint: t('hints.newTransaction'),
      icon: CreditCard,
      onClick: () => openModal('transaction'),
    },
    {
      label: t('newBudget'),
      hint: t('hints.newBudget'),
      icon: PieChart,
      onClick: () => openModal('budget'),
    },
    {
      label: t('newAccount'),
      hint: t('hints.newAccount'),
      icon: Wallet,
      onClick: () => openModal('account'),
    },
    {
      label: t('newCategory'),
      hint: t('hints.newCategory'),
      icon: Tag,
      onClick: () => openModal('category'),
    },
    {
      label: t('newInvestment'),
      hint: t('hints.newInvestment'),
      icon: TrendingUp,
      onClick: () => openModal('investment'),
    },
    {
      label: t('recurring'),
      hint: t('hints.recurring'),
      icon: RefreshCw,
      onClick: () => openModal('recurring'),
    },
  ];

  const displayItems = reverseMobileOrder && isMobile ? [...actionItems].reverse() : actionItems;

  const primaryWhenGrouped: ActionMenuItem[] = [
    {
      label: t('newTransaction'),
      hint: t('hints.newTransaction'),
      icon: CreditCard,
      onClick: () => openModal('transaction'),
    },
    {
      label: t('newBudget'),
      hint: t('hints.newBudget'),
      icon: PieChart,
      onClick: () => openModal('budget'),
    },
    {
      label: t('newAccount'),
      hint: t('hints.newAccount'),
      icon: Wallet,
      onClick: () => openModal('account'),
    },
  ];

  const secondaryWhenGrouped: ActionMenuItem[] = [
    {
      label: t('newCategory'),
      hint: t('hints.newCategory'),
      icon: Tag,
      onClick: () => openModal('category'),
    },
    {
      label: t('newInvestment'),
      hint: t('hints.newInvestment'),
      icon: TrendingUp,
      onClick: () => openModal('investment'),
    },
    {
      label: t('recurring'),
      hint: t('hints.recurring'),
      icon: RefreshCw,
      onClick: () => openModal('recurring'),
    },
  ];

  const contentPositionProps = groupedSecondary
    ? { align: 'center' as const, collisionPadding: 24, side: 'top' as const, sideOffset: 10 }
    : { align, collisionPadding: 16, sideOffset: 4 };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={handleOpenChange}>
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
            {showFabIntro ? (
              <>
                <DropdownMenuLabel className="max-w-[min(100vw-2rem,20rem)] text-xs font-normal leading-snug text-muted-foreground">
                  {t('fabIntro')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {extraMenuItems.map(renderMenuItem)}
            {extraMenuItems.length > 0 ? <DropdownMenuSeparator /> : null}
            {primaryWhenGrouped.map(renderMenuItem)}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              aria-expanded={secondaryOpen}
              title={t('hints.expandSecondary')}
              className="min-h-11 text-muted-foreground focus:text-foreground"
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
