'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { TransactionsLedger } from './transactions-ledger';
import { RecurringLedgerFallback, RecurringLedgerWithSeries } from './recurring-ledger';
import type { RecurringLedgerProps, TransactionsLedgerProps } from './transactions-workspace-props';
import type { RecurringTransactionSeries } from '@/lib/types';

export function TransactionsWorkspace({
  activeTab,
  onTabChange,
  seriesPromise,
  recurring,
  ledger,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seriesPromise: Promise<RecurringTransactionSeries[]>;
  ledger: Omit<TransactionsLedgerProps, 'tabs'>;
  recurring: Omit<RecurringLedgerProps, 'tabs' | 'series'>;
}) {
  const t = useTranslations('TransactionsContent');
  const tabs = (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className={stitchTransactions.tabsList} aria-label={t('tabsAria')}>
        <TabsTrigger className={stitchTransactions.tabsTrigger} value="Transactions">
          {t('tabs.transactions')}
        </TabsTrigger>
        <TabsTrigger className={stitchTransactions.tabsTrigger} value="Recurrent">
          {t('tabs.recurrent')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  if (activeTab === 'Recurrent') {
    return (
      <Suspense fallback={<RecurringLedgerFallback tabs={tabs} />}>
        <RecurringLedgerWithSeries {...recurring} tabs={tabs} seriesPromise={seriesPromise} />
      </Suspense>
    );
  }

  return <TransactionsLedger {...ledger} tabs={tabs} />;
}
