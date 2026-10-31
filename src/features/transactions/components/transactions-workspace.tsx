'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { stitchPageTabs } from '@/styles/home-design-foundation';
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
    <Tabs value={activeTab} onValueChange={onTabChange} className="gap-0">
      <div className={stitchPageTabs.stickyBar}>
        <div className={`${stitchPageTabs.stickyStack} mx-auto max-w-5xl`}>
          <div className={stitchPageTabs.leading}>
            <UserSelector
              hideTitle
              currentUser={currentUser}
              users={groupUsers}
              value={selectedUserId ?? 'all'}
              onChange={onUserFilterChange}
            />
          </div>
          <TabsList className={stitchPageTabs.list} aria-label={t('tabsAria')}>
            <TabsTrigger value="Transactions" className={stitchPageTabs.trigger}>
              {t('tabs.transactions')}
            </TabsTrigger>
            <TabsTrigger value="Recurrent" className={stitchPageTabs.trigger}>
              {t('tabs.recurrent')}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      <TabsContent value="Recurrent" className="mt-0">
        <Suspense fallback={<RecurringLedgerFallback />}>
          <RecurringLedgerWithSeries {...recurring} seriesPromise={seriesPromise} />
        </Suspense>
      </TabsContent>
      <TabsContent value="Transactions" className="mt-0">
        <TransactionsLedger {...ledger} />
      </TabsContent>
    </Tabs>
  );
}
