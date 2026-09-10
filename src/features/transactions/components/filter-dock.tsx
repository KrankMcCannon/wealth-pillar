'use client';

import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterChip } from '@/components/ui/filters';
import { stitchPeopleChip } from '@/styles/home-design-foundation';
import { initialsFromName } from '@/lib/utils/string-formatter';
import type { User } from '@/lib/types';

export function FilterDock({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function PeopleChips({
  ariaLabel,
  allLabel,
  peopleAria,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
}: {
  ariaLabel: string;
  allLabel: string;
  peopleAria: (name: string) => string;
  groupUsers: User[];
  selectedUserId: string | undefined;
  onUserFilterChange: (userId: string) => void;
}) {
  const people = [
    { id: 'all' as const, name: allLabel, initials: null },
    ...groupUsers.map((user) => {
      const name = user.name?.trim() || 'User';
      return {
        id: user.id,
        name,
        initials: initialsFromName(name, { emptyFallback: '?', singleWord: 'two' }),
      };
    }),
  ];

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={stitchPeopleChip.row}
    >
      {people.map((person) => {
        const selected = person.id === 'all' ? !selectedUserId : selectedUserId === person.id;
        const short = person.name.split(/\s+/)[0] ?? person.name;
        return (
          <button
            key={person.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={peopleAria(person.name)}
            onClick={() => onUserFilterChange(person.id)}
            className={cn(
              stitchPeopleChip.item,
              selected ? stitchPeopleChip.itemActive : stitchPeopleChip.itemInactive
            )}
          >
            <span
              className={cn(
                stitchPeopleChip.avatar,
                selected ? stitchPeopleChip.avatarActive : stitchPeopleChip.avatarInactive
              )}
              aria-hidden
            >
              {person.initials ? person.initials : <Users className="size-3" strokeWidth={2} />}
            </span>
            {short}
          </button>
        );
      })}
    </div>
  );
}

export function CompactSegments<T extends string>({
  ariaLabel,
  options,
  selected,
  onSelect,
}: {
  ariaLabel: string;
  options: Array<{ key: T; label: string; count?: number }>;
  selected: T;
  onSelect: (key: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
    >
      {options.map((option) => {
        const isSelected = selected === option.key;
        const label =
          option.count === undefined ? option.label : `${option.label} ${option.count}`;
        return (
          <FilterChip
            key={option.key}
            role="radio"
            label={label}
            active={isSelected}
            onClick={() => onSelect(option.key)}
          />
        );
      })}
    </div>
  );
}
