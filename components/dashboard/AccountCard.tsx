import React, { memo } from 'react';
import { Card } from '../ui';
import { Account } from '../../types';
import { formatCurrency } from '../../constants';

/**
 * Props per AccountCard
 */
interface AccountCardProps {
  account: Account;
  balance: number;
  personName?: string;
}

/**
 * Componente AccountCard ottimizzato
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione di un account
 * Principio DRY: Don't Repeat Yourself - riutilizzabile
 */
export const AccountCard = memo<AccountCardProps>(({ account, balance, personName }) => (
  <Card>
    <h3 className="font-semibold text-gray-500 dark:text-gray-400">{account.name}</h3>
    {personName && (
      <p className="text-xs text-blue-400 dark:text-blue-500">{personName}</p>
    )}
    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
      {formatCurrency(balance)}
    </p>
    <p className="text-sm text-gray-400 dark:text-gray-500 capitalize mt-1">
      {account.type} Account
    </p>
  </Card>
));

AccountCard.displayName = 'AccountCard';
