'use client';

import type { ReactNode, KeyboardEvent } from 'react';
import { FilterChip } from '@/components/ui/filters';

export function FilterDock({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
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
      className="flex flex-wrap gap-1.5 pb-0.5"
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const radios = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        );
        const current = radios.indexOf(event.target as HTMLButtonElement);
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? radios.length - 1
              : (current +
                  (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) +
                  radios.length) %
                radios.length;
        const option = options[next];
        if (option) {
          onSelect(option.key);
          radios[next]?.focus();
        }
      }}
    >
      {options.map((option) => {
        const isSelected = selected === option.key;
        const label = option.count === undefined ? option.label : `${option.label} ${option.count}`;
        return (
          <FilterChip
            key={option.key}
            role="radio"
            label={label}
            active={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(option.key)}
          />
        );
      })}
    </div>
  );
}
