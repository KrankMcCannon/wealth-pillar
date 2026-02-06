'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, truncateText, cn } from '@/lib/utils';
import type { Account } from '@/lib/types';
import { AccountTypeMap } from '@/lib/types';
import { RowCard } from '@/components/ui/layout/row-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@/components/ui';
import { cardStyles } from './theme/card-styles';

interface AccountCardProps {
  account: Account;
  accountBalance: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * AccountCard Component
 *
 * Now powered by the unified RowCard component.
 * Displays account information with balance and action menu.
 */
export const AccountCard = memo(function AccountCard({
  account,
  accountBalance,
  onClick,
  onEdit,
  onDelete,
  className,
}: Readonly<AccountCardProps>) {
  const t = useTranslations('Accounts.Card');
  const isNegative = accountBalance < 0;

  const primaryValue = formatCurrency(Math.abs(accountBalance));
  const secondaryValue = isNegative ? t('debt') : undefined;
  const amountVariant = isNegative ? 'destructive' : 'success';
  const accountTypeLabels: Partial<Record<keyof typeof AccountTypeMap, string>> = {
    payroll: t('accountTypes.payroll'),
    savings: t('accountTypes.savings'),
    cash: t('accountTypes.cash'),
    investments: t('accountTypes.investments'),
  };

  // Actions dropdown menu
  const actions =
    onEdit || onDelete ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cardStyles.account.actionsButton}>
            <MoreVertical className={cardStyles.account.actionsIcon} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className={cardStyles.account.actionItemIcon} />
              <span>{t('edit')}</span>
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={cardStyles.account.deleteItem}
            >
              <Trash2 className={cardStyles.account.actionItemIcon} />
              <span>{t('delete')}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : undefined;

  return (
    <RowCard
      icon={<Building2 className={cardStyles.account.icon} />}
      iconSize="md"
      iconColor="primary"
      title={truncateText(account.name, 20)}
      subtitle={accountTypeLabels[account.type] || AccountTypeMap[account.type] || account.type}
      primaryValue={primaryValue}
      secondaryValue={secondaryValue}
      amountVariant={amountVariant}
      actions={actions}
      variant="interactive"
      rightLayout="row"
      onClick={onClick}
      className={cn(cardStyles.account.container, className)}
      testId={`account-card-${account.id}`}
    />
  );
});
