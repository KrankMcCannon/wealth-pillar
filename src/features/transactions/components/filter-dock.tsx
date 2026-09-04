'use client';

import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initialsFromName } from '@/lib/utils/string-formatter';
import type { User } from '@/lib/types';

export function FilterDock({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function PeopleChips({
  label,
  ariaLabel,
  allLabel,
  peopleAria,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
}: {
  label: string;
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
    <div className="flex min-w-0 flex-col gap-1">
      <p className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
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
                'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                selected
                  ? 'bg-accent text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]'
                  : 'border border-border/35 bg-muted/70 text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  selected ? 'bg-muted text-primary' : 'bg-background/50 text-muted-foreground'
                )}
                aria-hidden
              >
                {person.initials ? person.initials : <Users className="size-3.5" strokeWidth={2} />}
              </span>
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompactSegments<T extends string>({
  label,
  ariaLabel,
  options,
  selected,
  onSelect,
}: {
  label: string;
  ariaLabel: string;
  options: Array<{ key: T; label: string; count?: number }>;
  selected: T;
  onSelect: (key: T) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="grid grid-cols-3 gap-0.5 rounded-full bg-muted/45 p-0.5"
      >
        {options.map((option) => {
          const isSelected = selected === option.key;
          const countLabel =
            option.count === undefined ? option.label : `${option.label}, ${option.count}`;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={countLabel}
              onClick={() => onSelect(option.key)}
              className={cn(
                'flex h-11 min-w-0 items-center justify-center gap-1 rounded-full px-1.5 text-xs font-semibold',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isSelected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.count !== undefined ? (
                <span className="tabular-nums opacity-70">{option.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
