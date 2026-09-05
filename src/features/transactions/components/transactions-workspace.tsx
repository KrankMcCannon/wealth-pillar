'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { PageTabsSticky } from '@/components/shared/page-tabs';
import UserSelector from '@/components/shared/user-selector';
import type { RecurringTransactionSeries, User } from '@/lib/types';
import { TransactionsLedger } from './transactions-ledger';
import { RecurringLedgerFallback, RecurringLedgerWithSeries } from './recurring-ledger';
import type { RecurringLedgerProps, TransactionsLedgerProps } from './transactions-workspace-props';

export function TransactionsWorkspace({
  activeTab,
  onTabChange,
  currentUser,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  seriesPromise,
  recurring,
  ledger,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  groupUsers: User[];
  selectedUserId: string | undefined;
  onUserFilterChange: (userId: string) => void;
  seriesPromise: Promise<RecurringTransactionSeries[]>;
  ledger: TransactionsLedgerProps;
  recurring: Omit<RecurringLedgerProps, 'series'>;
}) {
  const t = useTranslations('TransactionsContent');

  return (
    <>
      <PageTabsSticky
        value={activeTab}
        onValueChange={onTabChange}
        ariaLabel={t('tabsAria')}
        items={[
          { value: 'Transactions', label: t('tabs.transactions') },
          { value: 'Recurrent', label: t('tabs.recurrent') },
        ]}
        leading={
          <UserSelector
            hideTitle
            currentUser={currentUser}
            users={groupUsers}
            value={selectedUserId ?? 'all'}
            onChange={onUserFilterChange}
          />
        }
      />
      {activeTab === 'Recurrent' ? (
        <Suspense fallback={<RecurringLedgerFallback />}>
          <RecurringLedgerWithSeries {...recurring} seriesPromise={seriesPromise} />
        </Suspense>
      ) : (
        <TransactionsLedger {...ledger} />
      )}
    </>
  );
}
