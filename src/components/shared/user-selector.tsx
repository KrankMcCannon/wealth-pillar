'use client';

import { memo, useCallback, useId, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { useUserFilter } from '@/hooks';
import { User } from '@/lib/types';
import { userSelectorStyles } from './theme/user-selector-styles';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0] ?? '';
    const slice = w.slice(0, 2);
    return slice.length > 0 ? slice.toUpperCase() : '?';
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  const a = first.charAt(0);
  const b = last.charAt(0);
  if (!a && !b) return '?';
  return `${a}${b}`.toUpperCase();
}

interface UserSelectorProps {
  className?: string;
  isLoading?: boolean;
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
    isLoading = false,
    currentUser,
    users,
    value,
    onChange,
    showAllOption = true,
    hideTitle = false,
  }: UserSelectorProps) => {
    const headingId = useId();
    const t = useTranslations('UserSelector');
    // Read from props instead of stores
    const { selectedGroupFilter, setSelectedGroupFilter } = useUserFilter();

    // Determine current selection: Controlled (value) > Uncontrolled (store)
    const currentSelection = value ?? selectedGroupFilter;

    // Memoized user list with "All Members" option
    const membersList = useMemo(() => {
      const list: Array<{ id: string; name: string; isSpecial: boolean }> = users.map((user) => ({
        id: user.id,
        name: user.name,
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

    // Memoized click handler
    const handleMemberClick = useCallback(
      (memberId: string) => {
        // If controlled, call onChange
        if (onChange) {
          if (memberId !== value) {
            onChange(memberId);
          }
          return;
        }

        // Default: use store
        if (memberId !== selectedGroupFilter) {
          setSelectedGroupFilter(memberId);
        }
      },
      [selectedGroupFilter, setSelectedGroupFilter, onChange, value]
    );

    // Early return for non-admin users
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return null;
    }

    // Hide if only 1 user in group
    if (users.length === 1) {
      return null;
    }

    // Loading state
    if (isLoading) {
      return (
        <section
          className={`${userSelectorStyles.loading.container} ${className}`}
          aria-label={t('contextLabel')}
          aria-busy="true"
        >
          <div className={userSelectorStyles.loading.heading} aria-hidden />
          <div className={userSelectorStyles.loading.list}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={userSelectorStyles.loading.item}>
                <div className={userSelectorStyles.loading.avatar} />
                <div className={userSelectorStyles.loading.text} />
              </div>
            ))}
          </div>
        </section>
      );
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
                className={`${userSelectorStyles.item.base} ${
                  isSelected ? userSelectorStyles.item.active : userSelectorStyles.item.inactive
                }`}
                disabled={isLoading}
                aria-pressed={isSelected}
                aria-label={t('selectUserAria', { name: member.name })}
              >
                <div
                  className={`${userSelectorStyles.avatar.base} ${
                    isSelected
                      ? userSelectorStyles.avatar.active
                      : userSelectorStyles.avatar.inactive
                  }`}
                  aria-hidden
                >
                  {isAll ? (
                    <Users className={userSelectorStyles.avatar.allIcon} strokeWidth={2} />
                  ) : (
                    <span className={userSelectorStyles.initials}>{getInitials(member.name)}</span>
                  )}
                </div>

                <span className={userSelectorStyles.label}>{member.name}</span>
              </button>
            );
          })}
        </div>

        {membersList.length > 3 && (
          <div className={userSelectorStyles.dots.container}>
            {membersList.map((member) => (
              <div
                key={`dot-${member.id}`}
                className={`${userSelectorStyles.dots.base} ${
                  member.id === currentSelection
                    ? userSelectorStyles.dots.active
                    : userSelectorStyles.dots.inactive
                }`}
                aria-hidden
              />
            ))}
          </div>
        )}
      </section>
    );
  }
);

UserSelector.displayName = 'UserSelector';

export default UserSelector;
