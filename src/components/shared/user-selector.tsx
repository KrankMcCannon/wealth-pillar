'use client';

import { memo, useCallback, useId, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { useUserFilter } from '@/hooks';
import { User } from '@/lib/types';
import { UserSelectorSkeleton } from '@/components/ui/primitives/skeletons/dashboard-skeletons';
import type { CSSProperties } from 'react';

const userSelectorStyles = {
  container: 'border-0 bg-transparent px-0 pb-0 pt-0 backdrop-blur-none',
  heading: 'mb-2.5 text-[11px] font-bold uppercase tracking-wide text-primary',
  list: 'flex touch-pan-x items-stretch gap-2 overflow-x-auto overscroll-x-contain scroll-pl-1 pb-0.5 [-webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent',
  listStyle: {
    scrollbarWidth: 'thin',
  } satisfies CSSProperties,
  item: {
    base: 'group flex min-h-11 min-w-[44px] shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 text-left text-[12px] font-medium tracking-wide outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:min-h-[48px] sm:px-3.5',
    active:
      'border-transparent bg-accent text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
    inactive:
      'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground',
  },
  avatar: {
    base: 'flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-200',
    active: 'border-border/35 bg-muted text-primary',
    inactive: 'border-border/35 bg-muted text-muted-foreground',
    allIcon: 'size-4 text-primary',
  },
  initials: 'leading-none',
  label: 'max-w-[6.5rem] truncate text-foreground sm:max-w-[7.5rem]',
  dots: {
    container: 'mt-2 flex max-w-full justify-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide',
    base: 'h-1 rounded-full transition-all duration-300',
    active: 'w-4 bg-primary/80',
    inactive: 'w-1.5 bg-border/40',
  },
} as const;

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
        <section className={className} aria-label={t('contextLabel')} aria-busy="true">
          <UserSelectorSkeleton />
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
