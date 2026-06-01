'use client';

import { format } from 'date-fns';
import { dayButtonVariants, getDayState } from '@/lib/utils/date-drawer-variants';

export interface DayCellProps {
  date: Date;
  ariaLabel: string;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isOtherMonth: boolean;
  onClick: (date: Date) => void;
}

export function DayCell({
  date,
  ariaLabel,
  isSelected,
  isToday,
  isDisabled,
  isWeekend,
  isOtherMonth,
  onClick,
}: Readonly<DayCellProps>) {
  const state = getDayState({
    isSelected,
    isToday,
    isDisabled,
    isWeekend,
    isOtherMonth,
  });

  const handleClick = () => {
    if (!isDisabled) {
      onClick(date);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      className={dayButtonVariants({ state })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      aria-current={isToday ? 'date' : undefined}
      tabIndex={isDisabled ? -1 : 0}
    >
      {format(date, 'd')}
    </button>
  );
}
