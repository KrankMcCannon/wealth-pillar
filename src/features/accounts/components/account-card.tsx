'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { Account } from '@/lib/types';
import { AccountTypeMap } from '@/lib/types';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import { RowCard } from '@/components/ui/layout/row-card';
import { cardStyles } from '@/components/cards/theme/card-styles';

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

function accountSubtitle(
  account: Account,
  liquidityLabel: string,
  typeLabels: Partial<Record<keyof typeof AccountTypeMap, string>>
) {
  return `${typeLabels[account.type] || AccountTypeMap[account.type] || account.type} · ${liquidityLabel}`;
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
  const accountTypeLabels: Partial<Record<keyof typeof AccountTypeMap, string>> = {
    payroll: t('accountTypes.payroll'),
    savings: t('accountTypes.savings'),
    cash: t('accountTypes.cash'),
    investments: t('accountTypes.investments'),
  };
  const liquidity = resolveAccountLiquidity(account);
  const liquidityLabel = t(`liquidity.${liquidity}`);
  const subtitle = accountSubtitle(account, liquidityLabel, accountTypeLabels);
  const meta = isNegative ? `${subtitle} · ${t('debt')}` : subtitle;

  if (balancePresentation === 'dashboard') {
    return (
      <RowCard
        icon={<Building2 className={cardStyles.account.sliderIcon} />}
        iconSize="xs"
        iconColor="primary"
        title={account.name}
        subtitle={subtitle}
        primaryValue={primaryValue}
        secondaryValue={isNegative ? t('debt') : undefined}
        amountVariant={isNegative ? 'destructive' : 'primary'}
        variant="regular"
        rightLayout="row"
        onClick={onClick}
        interactiveAriaLabel={
          onClick !== undefined
            ? t('ariaOpenAccount', { name: account.name, balance: primaryValue })
            : undefined
        }
        compact
        className={cn(cardStyles.account.container, cardStyles.account.sliderTight, className)}
        testId={`account-card-${account.id}`}
      />
    );
  }

  return (
    <PlainListRow
      title={account.name}
      meta={meta}
      onClick={onClick}
      ariaLabel={
        onClick !== undefined
          ? t('ariaOpenAccount', { name: account.name, balance: primaryValue })
          : undefined
      }
      testId={`account-card-${account.id}`}
      className={className}
    >
      <Amount type={isNegative ? 'expense' : 'balance'} size="sm" emphasis="strong">
        {accountBalance}
      </Amount>
    </PlainListRow>
  );
});
