/**
 * Day Cell Component
 *
 * Touch-optimized calendar day button with all visual states
 * 48px minimum touch target (WCAG AA compliant)
 */

'use client';

import { format } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { dayButtonVariants, getDayState } from '@/lib/utils/date-drawer-variants';

export interface DayCellProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isOtherMonth: boolean;
  onClick: (date: Date) => void;
}

export function DayCell({
  date,
  isSelected,
  isToday,
  isDisabled,
  isWeekend,
  isOtherMonth,
  onClick,
}: Readonly<DayCellProps>) {
  const t = useTranslations('Forms.DateDrawer');
  const locale = useLocale();
  const state = getDayState({
    isSelected,
    isToday,
    isDisabled,
    isWeekend,
    isOtherMonth,
  });

  const dayNumber = format(date, 'd');

  const fullDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

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
    <motion.button
      type="button"
      className={dayButtonVariants({ state })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={t('dayCell.selectDate', { date: fullDate })}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      aria-current={isToday ? 'date' : undefined}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      {...(!isDisabled && {
        whileTap: { scale: 0.95 },
        whileHover: { scale: 1.05 },
      })}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }}
    >
      {dayNumber}
    </motion.button>
  );
}
