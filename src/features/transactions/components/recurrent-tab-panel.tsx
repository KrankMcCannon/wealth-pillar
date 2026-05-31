'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RecurringTransactionSeries, User } from '@/lib/types';
import { RecurringSeriesSection } from '@/features/recurring';
import { loadRecurringTabAction } from '../actions/transaction-actions';
import { RecurringSeriesSkeleton } from './transaction-skeletons';
import { UserFilterChipRow } from './user-filter-chip-row';
import { stitchTransactions } from '@/styles/home-design-foundation';

export interface RecurrentTabPanelProps {
  readonly isActive: boolean;
  readonly groupUsers: User[];
  readonly selectedUserId?: string | undefined;
  readonly onUserFilterChange: (userId: string) => void;
  readonly showUserPicker: boolean;
  readonly onCreateRecurringSeries: () => void;
  readonly onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
  readonly onSeriesUpdate: () => void;
}

export function RecurrentTabPanel({
  isActive,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  showUserPicker,
  onCreateRecurringSeries,
  onEditRecurringSeries,
  onSeriesUpdate,
}: RecurrentTabPanelProps) {
  const t = useTranslations('TransactionsContent');
  const [recurringSeries, setRecurringSeries] = useState<RecurringTransactionSeries[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const isLoading = recurringSeries === null && error === null;

  useEffect(() => {
    if (!isActive || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    loadRecurringTabAction()
      .then((result) => {
        if (cancelled) return;
        if (result.error || !result.data) {
          setError(result.error ?? t('recurrentLoadError'));
          return;
        }
        setRecurringSeries(result.data.recurringSeries);
      })
      .catch(() => {
        if (!cancelled) setError(t('recurrentLoadError'));
      });

    return () => {
      cancelled = true;
    };
  }, [isActive, t]);

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className={stitchTransactions.mainStack}>
        <RecurringSeriesSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={stitchTransactions.pageErrorBanner} role="alert">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={stitchTransactions.mainStack}>
      {showUserPicker ? (
        <UserFilterChipRow
          groupUsers={groupUsers}
          selectedUserId={selectedUserId}
          onUserFilterChange={onUserFilterChange}
        />
      ) : null}
      <RecurringSeriesSection
        series={recurringSeries ?? []}
        selectedUserId={selectedUserId ?? undefined}
        showStats
        showActions
        showDelete={false}
        onCreateRecurringSeries={onCreateRecurringSeries}
        onEditRecurringSeries={onEditRecurringSeries}
        groupUsers={groupUsers}
        onSeriesUpdate={onSeriesUpdate}
      />
    </div>
  );
}
