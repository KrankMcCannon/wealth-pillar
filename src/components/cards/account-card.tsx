'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { formatCurrency, truncateText, cn } from '@/lib/utils';
import type { Account } from '@/lib/types';
import { AccountTypeMap } from '@/lib/types';
import { RowCard } from '@/components/ui/layout/row-card';
import { stitchAccounts, stitchHome } from '@/styles/home-design-foundation';
import { cardStyles } from './theme/card-styles';

interface AccountCardProps {
  account: Account;
  accountBalance: number;
  /** Tap / invio sulla riga: apre modifica (come le transazioni). */
  onClick?: (() => void) | undefined;
  className?: string | undefined;
  /**
   * `dashboard`: saldi positivi in tinta primary (home slider) così il verde non compete col totale.
   * In questa modalità niente swipe (conflitto collo scroll orizzontale).
   */
  balancePresentation?: 'default' | 'dashboard';
}

/**
 * AccountCard — tap sulla riga → modifica (eliminazione dalla modale di modifica).
 */
export const AccountCard = memo(function AccountCard({
  account,
  accountBalance,
  onClick,
  className,
  balancePresentation = 'default',
}: Readonly<AccountCardProps>) {
  const t = useTranslations('Accounts.Card');
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
      {...(balancePresentation === 'default'
        ? { iconClassName: stitchAccounts.accountListIconWrap }
        : {})}
      iconColor="primary"
      title={balancePresentation === 'dashboard' ? account.name : truncateText(account.name, 20)}
      subtitle={accountTypeLabels[account.type] || AccountTypeMap[account.type] || account.type}
      primaryValue={primaryValue}
      secondaryValue={secondaryValue}
      amountVariant={amountVariant}
      actions={undefined}
      variant="regular"
      rightLayout="row"
      onClick={onClick}
      interactiveAriaLabel={interactiveAriaLabel}
      compact={balancePresentation === 'dashboard'}
      {...(balancePresentation === 'default'
        ? {
            titleClassName: stitchAccounts.accountListTitle,
            subtitleClassName: stitchAccounts.accountListSubtitle,
            valueClassName:
              amountVariant === 'success'
                ? stitchAccounts.accountListAmountSuccess
                : amountVariant === 'destructive'
                  ? stitchAccounts.accountListAmountNegative
                  : stitchAccounts.accountListAmountPrimary,
            ...(secondaryValue
              ? {
                  secondaryValueClassName: cn(
                    stitchAccounts.accountListAmountSecondary,
                    cardStyles.account.negativeLabel
                  ),
                }
              : {}),
          }
        : {})}
      className={cn(
        balancePresentation === 'dashboard'
          ? cn(cardStyles.account.container, cardStyles.account.sliderTight)
          : cn(stitchHome.listRowInteractive, 'w-full'),
        className
      )}
      testId={`account-card-${account.id}`}
    />
  );
});
