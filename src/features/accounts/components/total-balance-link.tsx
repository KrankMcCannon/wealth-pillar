/**
 * TotalBalanceLink Component
 * Displays spendable balance (primary) with reserve and savings metrics.
 */

'use client';

import { CreditCard, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { accountStyles } from '../theme/account-styles';
import { cn } from '@/lib/utils';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface TotalBalanceLinkProps {
  spendableBalance: number;
  reserveBalance?: number;
  netSavings?: NetSavingsResult;
  selectedUserId?: string | undefined;
  embedded?: boolean;
}

export const TotalBalanceLink = ({
  spendableBalance,
  reserveBalance = 0,
  netSavings,
  selectedUserId,
  embedded = false,
}: TotalBalanceLinkProps) => {
  const t = useTranslations('Accounts.Home');
  const isPositive = spendableBalance >= 0;
  const href = selectedUserId ? `/accounts?userId=${selectedUserId}` : '/accounts';

  return (
    <Link
      href={href}
      className={cn(
        embedded
          ? accountStyles.totalBalanceLink.embeddedContainer
          : accountStyles.totalBalanceLink.container
      )}
    >
      <div className={accountStyles.totalBalanceLink.leftSection}>
        <div
          className={
            embedded
              ? accountStyles.totalBalanceLink.embeddedIcon
              : accountStyles.totalBalanceLink.icon
          }
        >
          <CreditCard
            className={
              embedded
                ? accountStyles.totalBalanceLink.embeddedIconSvg
                : accountStyles.totalBalanceLink.iconSvg
            }
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p
            className={
              embedded
                ? accountStyles.totalBalanceLink.embeddedLabel
                : accountStyles.totalBalanceLink.label
            }
          >
            {t('spendableBalanceLabel')}
          </p>
          <Amount
            type={isPositive ? 'balance' : 'expense'}
            size="2xl"
            emphasis="strong"
            className={
              embedded
                ? isPositive
                  ? accountStyles.totalBalanceLink.embeddedValuePositive
                  : accountStyles.totalBalanceLink.embeddedValueNegative
                : isPositive
                  ? accountStyles.totalBalanceLink.valuePositive
                  : accountStyles.totalBalanceLink.valueNegative
            }
          >
            {spendableBalance}
          </Amount>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t('reserveBalanceLabel')}:{' '}
              <Amount type="balance" size="sm" className="inline">
                {reserveBalance}
              </Amount>
            </span>
            {netSavings !== undefined ? (
              <span>
                {t('savedThisPeriod')}:{' '}
                <Amount
                  type={netSavings.net >= 0 ? 'income' : 'expense'}
                  size="sm"
                  className="inline"
                >
                  {netSavings.net}
                </Amount>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={accountStyles.totalBalanceLink.rightSection}>
        <ArrowRight
          className={
            embedded
              ? accountStyles.totalBalanceLink.embeddedArrow
              : accountStyles.totalBalanceLink.arrow
          }
          aria-hidden
        />
      </div>
    </Link>
  );
};

export default TotalBalanceLink;
