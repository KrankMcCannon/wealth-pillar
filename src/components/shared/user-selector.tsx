'use client';

import { memo, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users, User as UserIcon, Crown, Star, Heart } from 'lucide-react';
import { useUserFilter } from '@/hooks';
import { User } from '@/lib/types';
import { userSelectorStyles } from './theme/user-selector-styles';

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
}

/**
 * Optimized UserSelector with memoization and modern UX
 * Prevents unnecessary re-renders and improves performance
 *
 * NOW STATELESS: Receives data via props
 */
const UserSelector = memo(
  ({
    className = '',
    isLoading = false,
    currentUser,
    users,
    value,
    onChange,
    showAllOption = true,
  }: UserSelectorProps) => {
    const t = useTranslations('UserSelector');
    // Read from props instead of stores
    const { selectedGroupFilter, setSelectedGroupFilter } = useUserFilter();

    // Determine current selection: Controlled (value) > Uncontrolled (store)
    const currentSelection = value ?? selectedGroupFilter;

    // Memoized icon selection
    const getUserIcon = useCallback((userId: string, index: number) => {
      const userIcons = [UserIcon, Crown, Star, Heart];
      if (userId === 'all') return Users;
      return userIcons[index % userIcons.length];
    }, []);

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
        <section className={`${userSelectorStyles.loading.container} ${className}`}>
          <div className={userSelectorStyles.loading.list}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={userSelectorStyles.loading.item}>
                <div className={userSelectorStyles.loading.icon}></div>
                <div className={userSelectorStyles.loading.text}></div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className={`${userSelectorStyles.container} ${className}`}>
        <div className={userSelectorStyles.list} style={userSelectorStyles.listStyle}>
          {membersList.map((member, index) => {
            const IconComponent = getUserIcon(member.id, index);
            const isSelected = currentSelection === member.id;

            return (
              <button
                key={member.id}
                onClick={() => handleMemberClick(member.id)}
                className={`${userSelectorStyles.item.base} ${
                  isSelected ? userSelectorStyles.item.active : userSelectorStyles.item.inactive
                }`}
                disabled={isLoading}
                aria-pressed={isSelected}
                aria-label={t('selectUserAria', { name: member.name })}
              >
                <div
                  className={`${userSelectorStyles.icon.containerBase} ${
                    isSelected
                      ? userSelectorStyles.icon.containerActive
                      : userSelectorStyles.icon.containerInactive
                  }`}
                >
                  <IconComponent
                    className={`${userSelectorStyles.icon.svgBase} ${
                      isSelected
                        ? userSelectorStyles.icon.svgActive
                        : userSelectorStyles.icon.svgInactive
                    }`}
                  />
                </div>

                <span className={userSelectorStyles.label}>{member.name}</span>

                {/* Hover indicator only for non-selected */}
                {!isSelected && <div className={userSelectorStyles.hoverIndicator} />}
              </button>
            );
          })}
        </div>

        {/* Selection indicator dots (for visual feedback) */}
        {membersList.length > 3 && (
          <div className={userSelectorStyles.dots.container}>
            {membersList.slice(0, Math.min(membersList.length, 5)).map((member, index) => (
              <div
                key={`dot-${member.id}`}
                className={`${userSelectorStyles.dots.base} ${
                  index === membersList.findIndex((m) => m.id === currentSelection)
                    ? userSelectorStyles.dots.active
                    : userSelectorStyles.dots.inactive
                }`}
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
