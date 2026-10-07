'use client';

import type { ReactNode } from 'react';
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
      className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
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
            onClick={() => onSelect(option.key)}
          />
        );
      })}
    </div>
  );
}
