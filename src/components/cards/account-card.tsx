'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { formatCurrency, truncateText, cn } from '@/lib/utils';
import type { Account } from '@/lib/types';
import { AccountTypeMap } from '@/lib/types';
import { RowCard } from '@/components/ui/layout/row-card';
import { useCloseAllCards } from '@/stores/swipe-state-store';
import { cardStyles } from './theme/card-styles';

interface AccountCardProps {
  account: Account;
  accountBalance: number;
  /** Tap / invio sulla riga: apre modifica (come le transazioni). */
  onClick?: (() => void) | undefined;
  /** Swipe per eliminare; sul carosello home non viene passato. */
  onDelete?: (() => void) | undefined;
  className?: string | undefined;
  /**
   * `dashboard`: saldi positivi in tinta primary (home slider) così il verde non compete col totale.
   * In questa modalità niente swipe (conflitto collo scroll orizzontale).
   */
  balancePresentation?: 'default' | 'dashboard';
}

/**
 * AccountCard — stessa logica delle transazioni: tap → modifica, swipe → elimina (se `onDelete`).
 * Niente menu ⋯ duplicato per “Modifica”.
 */
export const AccountCard = memo(function AccountCard({
  account,
  accountBalance,
  onClick,
  onDelete,
  className,
  balancePresentation = 'default',
}: Readonly<AccountCardProps>) {
  const t = useTranslations('Accounts.Card');
  const tSwipe = useTranslations('Common.Swipe');
  const closeAllCards = useCloseAllCards();
  const isNegative = accountBalance < 0;

  const primaryValue = formatCurrency(Math.abs(accountBalance));
  const secondaryValue = isNegative ? t('debt') : undefined;
  const amountVariant = isNegative
    ? 'destructive'
    : balancePresentation === 'dashboard'
      ? 'primary'
      : 'success';
  const accountTypeLabels: Partial<Record<keyof typeof AccountTypeMap, string>> = {
    payroll: t('accountTypes.payroll'),
    savings: t('accountTypes.savings'),
    cash: t('accountTypes.cash'),
    investments: t('accountTypes.investments'),
  };

  const handleDelete = () => {
    closeAllCards();
    onDelete?.();
  };

  const useSwipeDelete = balancePresentation === 'default' && Boolean(onDelete);

  const interactiveAriaLabel =
    onClick !== undefined
      ? t('ariaOpenAccount', { name: account.name, balance: primaryValue })
      : undefined;

  return (
    <RowCard
      icon={
        <Building2
          className={
            balancePresentation === 'dashboard'
              ? cardStyles.account.sliderIcon
              : cardStyles.account.icon
          }
        />
      }
      iconSize={balancePresentation === 'dashboard' ? 'xs' : 'sm'}
      {...(balancePresentation === 'default' ? { iconClassName: '!rounded-xl' } : {})}
      iconColor="primary"
      title={balancePresentation === 'dashboard' ? account.name : truncateText(account.name, 20)}
      subtitle={accountTypeLabels[account.type] || AccountTypeMap[account.type] || account.type}
      primaryValue={primaryValue}
      secondaryValue={secondaryValue}
      amountVariant={amountVariant}
      actions={undefined}
      variant="interactive"
      rightLayout="row"
      onClick={useSwipeDelete ? undefined : onClick}
      interactiveAriaLabel={useSwipeDelete ? undefined : interactiveAriaLabel}
      swipeDragHint={useSwipeDelete ? tSwipe('rowSwipeHint') : undefined}
      swipeConfig={
        useSwipeDelete
          ? {
              id: `account-${account.id}`,
              deleteAction: {
                label: t('delete'),
                variant: 'delete',
                onAction: handleDelete,
              },
              onCardClick: onClick,
            }
          : undefined
      }
      compact={balancePresentation === 'dashboard'}
      {...(balancePresentation === 'default'
        ? {
            titleClassName: cardStyles.account.listTitle,
            subtitleClassName: cardStyles.account.listSubtitle,
            valueClassName: cardStyles.account.listAmount,
            ...(secondaryValue
              ? {
                  secondaryValueClassName: cn(
                    cardStyles.account.listAmountSecondary,
                    cardStyles.account.negativeLabel
                  ),
                }
              : {}),
          }
        : {})}
      className={cn(
        balancePresentation === 'dashboard'
          ? cn(cardStyles.account.container, cardStyles.account.sliderTight)
          : cardStyles.account.listRow,
        className
      )}
      testId={`account-card-${account.id}`}
    />
  );
});
