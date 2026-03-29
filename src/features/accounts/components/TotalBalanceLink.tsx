/**
 * TotalBalanceLink Component
 * Displays total balance with account count
 * Clickable to navigate to /accounts page
 * Used in dashboard balance section
 */

'use client';

import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { accountStyles } from '../theme/account-styles';
import { cn, formatCurrency } from '@/lib/utils';

interface TotalBalanceLinkProps {
  totalBalance: number;
  accountCount: number;
  selectedUserId?: string | undefined;
  /** In cima al blocco saldi: un solo contenitore arrotondato, senza “doppia card”. */
  embedded?: boolean;
}

export const TotalBalanceLink = ({
  totalBalance,
  accountCount,
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
      {/* Left Section - Balance Info */}
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
          <p
            className={
              isPositive
                ? embedded
                  ? accountStyles.totalBalanceLink.embeddedValuePositive
                  : accountStyles.totalBalanceLink.valuePositive
                : embedded
                  ? accountStyles.totalBalanceLink.embeddedValueNegative
                  : accountStyles.totalBalanceLink.valueNegative
            }
          >
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Right Section - Account Count Badge */}
      <div className={accountStyles.totalBalanceLink.rightSection}>
        <div
          className={
            embedded
              ? accountStyles.totalBalanceLink.embeddedBadge
              : accountStyles.totalBalanceLink.badge
          }
        >
          <span className={accountStyles.totalBalanceLink.badgeText}>
            {t('accountCount', { count: accountCount })}
          </span>
        </div>
        <ArrowRight
          className={
            embedded
              ? accountStyles.totalBalanceLink.embeddedArrow
              : accountStyles.totalBalanceLink.arrow
          }
        />
      </div>
    </Link>
  );
};

export default TotalBalanceLink;
