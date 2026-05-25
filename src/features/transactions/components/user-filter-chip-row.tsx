'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { FilterChip } from '@/components/ui/filters';
import { stitchTransactions } from '@/styles/home-design-foundation';

export interface UserFilterChipRowProps {
  readonly groupUsers: User[];
  readonly selectedUserId?: string | undefined;
  readonly onUserFilterChange: (userId: string) => void;
  readonly className?: string;
}

export function UserFilterChipRow({
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  className,
}: UserFilterChipRowProps) {
  const tUsers = useTranslations('UserSelector');
  const tChips = useTranslations('Transactions.Filters.FilterChips');

  return (
    <div className={cn(stitchTransactions.chipRowUserWrap, '-mx-4 px-4', className)}>
      <div
        className={stitchTransactions.chipRowUserScroll}
        role="toolbar"
        aria-label={tChips('userToolbarAria')}
      >
        <FilterChip
          label={tUsers('all')}
          active={(selectedUserId ?? 'all') === 'all'}
          onClick={() => onUserFilterChange('all')}
          className={stitchTransactions.chipSnapItem}
        />
        {groupUsers.map((user) => (
          <FilterChip
            key={user.id}
            label={user.name ?? 'User'}
            active={selectedUserId === user.id}
            onClick={() => onUserFilterChange(user.id)}
            className={stitchTransactions.chipSnapItem}
          />
        ))}
      </div>
      <p className={stitchTransactions.chipScrollHint}>{tChips('userChipsScrollHint')}</p>
    </div>
  );
}
