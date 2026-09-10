'use client';

import { memo, useCallback, useId, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { useUserFilter } from '@/hooks';
import { User } from '@/lib/types';
import { initialsFromName } from '@/lib/utils/string-formatter';
import { cn } from '@/lib/utils';
import { stitchPeopleChip } from '@/styles/home-design-foundation';
import type { CSSProperties } from 'react';

const userSelectorStyles = {
  container: 'border-0 bg-transparent px-0 pb-0 pt-0 backdrop-blur-none',
  heading: 'mb-2 text-xs font-medium text-muted-foreground',
  list: stitchPeopleChip.row,
  listStyle: {
    scrollbarWidth: 'thin',
  } satisfies CSSProperties,
  item: {
    base: stitchPeopleChip.item,
    active: stitchPeopleChip.itemActive,
    inactive: stitchPeopleChip.itemInactive,
  },
  avatar: {
    base: stitchPeopleChip.avatar,
    active: stitchPeopleChip.avatarActive,
    inactive: stitchPeopleChip.avatarInactive,
    allIcon: 'size-3.5 text-foreground',
  },
  initials: 'leading-none',
  label: stitchPeopleChip.label,
} as const;

const displayInitials = (name: string) =>
  initialsFromName(name, { emptyFallback: '?', singleWord: 'two' });

interface UserSelectorProps {
  className?: string;
  currentUser: User;
  users: User[];
  /** Optional: Controlled value (if provided, useUserFilter is ignored) */
  value?: string;
  /** Optional: Controlled change handler (if provided, useUserFilter is ignored) */
  onChange?: (userId: string) => void;
  /** Optional: Show "All Users" option (default: true) */
  showAllOption?: boolean;
  /** Nasconde l’h2 interno quando la pagina espone già un SectionHeader con lo stesso titolo */
  hideTitle?: boolean;
}

/** Filtro prospettiva gruppo (admin): stato da props o da `useUserFilter`. */
const UserSelector = memo(
  ({
    className = '',
    currentUser,
    users,
    value,
    onChange,
    showAllOption = true,
    hideTitle = false,
  }: UserSelectorProps) => {
    const headingId = useId();
    const t = useTranslations('UserSelector');
    const { selectedGroupFilter, setSelectedGroupFilter } = useUserFilter();

    const currentSelection = value ?? selectedGroupFilter;

    const membersList = useMemo(() => {
      const list: Array<{ id: string; name: string; isSpecial: boolean }> = users.map((user) => ({
        id: user.id,
        name: user.name ?? '',
        isSpecial: false,
      }));

      if (showAllOption) {
        list.unshift({
          id: 'all',
          name: t('all'),
          isSpecial: true,
        });
      }
      return list;
    }, [users, showAllOption, t]);

    const handleMemberClick = useCallback(
      (memberId: string) => {
        if (onChange) {
          if (memberId !== value) {
            onChange(memberId);
          }
          return;
        }

        if (memberId !== selectedGroupFilter) {
          setSelectedGroupFilter(memberId);
        }
      },
      [selectedGroupFilter, setSelectedGroupFilter, onChange, value]
    );

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return null;
    }

    if (users.length === 1) {
      return null;
    }

    return (
      <section
        className={`${userSelectorStyles.container} ${className}`}
        aria-label={hideTitle ? t('contextLabel') : undefined}
        aria-labelledby={hideTitle ? undefined : headingId}
      >
        {!hideTitle ? (
          <h2 id={headingId} className={userSelectorStyles.heading}>
            {t('contextLabel')}
          </h2>
        ) : null}
        <div className={userSelectorStyles.list} style={userSelectorStyles.listStyle}>
          {membersList.map((member) => {
            const isSelected = currentSelection === member.id;
            const isAll = member.id === 'all';

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleMemberClick(member.id)}
                className={cn(
                  userSelectorStyles.item.base,
                  isSelected ? userSelectorStyles.item.active : userSelectorStyles.item.inactive
                )}
                aria-pressed={isSelected}
                aria-label={t('selectUserAria', { name: member.name })}
              >
                <div
                  className={cn(
                    userSelectorStyles.avatar.base,
                    isSelected
                      ? userSelectorStyles.avatar.active
                      : userSelectorStyles.avatar.inactive
                  )}
                  aria-hidden
                >
                  {isAll ? (
                    <Users className={userSelectorStyles.avatar.allIcon} strokeWidth={2} />
                  ) : (
                    <span className={userSelectorStyles.initials}>
                      {displayInitials(member.name)}
                    </span>
                  )}
                </div>

                <span className={userSelectorStyles.label}>{member.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
);

UserSelector.displayName = 'UserSelector';

export default UserSelector;
