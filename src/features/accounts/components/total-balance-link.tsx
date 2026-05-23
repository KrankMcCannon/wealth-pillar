/**
 * TotalBalanceLink Component
 * Displays total balance with link to /accounts page
 * Used in dashboard balance section
 */

'use client';

import { CreditCard, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { accountStyles } from '../theme/account-styles';
import { cn } from '@/lib/utils';

interface TotalBalanceLinkProps {
  totalBalance: number;
  selectedUserId?: string | undefined;
  /** In cima al blocco saldi: un solo contenitore arrotondato, senza “doppia card”. */
  embedded?: boolean;
}

export const TotalBalanceLink = ({
  totalBalance,
  selectedUserId,
  embedded = false,
}: TotalBalanceLinkProps) => {
  const t = useTranslations('Accounts.Home');
  const isPositive = totalBalance >= 0;
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
            {t('totalBalanceLabel')}
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
            {totalBalance}
          </Amount>
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
