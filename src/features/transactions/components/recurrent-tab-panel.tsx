'use client';

import { Suspense, use } from 'react';
import type { RecurringTransactionSeries, User } from '@/lib/types';
import { RecurringSeriesSection } from '@/features/recurring';
import { RecurringSeriesSkeleton } from './transaction-skeletons';
import { UserFilterChipRow } from './user-filter-chip-row';
import { stitchTransactions } from '@/styles/home-design-foundation';

export interface RecurrentTabPanelProps {
  readonly isActive: boolean;
  readonly recurringSeriesPromise: Promise<RecurringTransactionSeries[]>;
  readonly groupUsers: User[];
  readonly selectedUserId?: string | undefined;
  readonly onUserFilterChange: (userId: string) => void;
  readonly showUserPicker: boolean;
  readonly onCreateRecurringSeries: () => void;
  readonly onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
}

function RecurrentTabPanelContent({
  recurringSeriesPromise,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  showUserPicker,
  onCreateRecurringSeries,
  onEditRecurringSeries,
}: Omit<RecurrentTabPanelProps, 'isActive'>) {
  const recurringSeries = use(recurringSeriesPromise);

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
        series={recurringSeries}
        selectedUserId={selectedUserId ?? undefined}
        showStats
        onCreateRecurringSeries={onCreateRecurringSeries}
        onEditRecurringSeries={onEditRecurringSeries}
      />
    </div>
  );
}

export function RecurrentTabPanel({
  isActive,
  recurringSeriesPromise,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  showUserPicker,
  onCreateRecurringSeries,
  onEditRecurringSeries,
}: RecurrentTabPanelProps) {
  if (!isActive) return null;

  return (
    <Suspense
      fallback={
        <div className={stitchTransactions.mainStack}>
          <RecurringSeriesSkeleton />
        </div>
      }
    >
      <RecurrentTabPanelContent
        recurringSeriesPromise={recurringSeriesPromise}
        groupUsers={groupUsers}
        selectedUserId={selectedUserId}
        onUserFilterChange={onUserFilterChange}
        showUserPicker={showUserPicker}
        onCreateRecurringSeries={onCreateRecurringSeries}
        onEditRecurringSeries={onEditRecurringSeries}
      />
    </Suspense>
  );
}
