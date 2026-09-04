/**
 * Date drawer CVA variants — single source of truth for calendar day/nav styling.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const dayButtonVariants = cva(
  [
    'inline-flex w-full items-center justify-center',
    'aspect-square',
    'rounded-xl',
    'text-sm font-medium tabular-nums',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25',
  ].join(' '),
  {
    variants: {
      state: {
        default: 'bg-transparent text-foreground hover:bg-muted',
        selected: 'bg-foreground font-semibold text-background hover:bg-foreground/90',
        today: 'bg-transparent text-foreground ring-1 ring-inset ring-foreground/25 hover:bg-muted',
        disabled: 'cursor-not-allowed bg-transparent text-muted-foreground/40 hover:bg-transparent',
        weekend: 'bg-transparent text-foreground hover:bg-muted',
        otherMonth: 'bg-transparent text-muted-foreground/45 hover:bg-muted/60',
      },
    },
    defaultVariants: { state: 'default' },
  }
);

export const monthNavButtonVariants = cva(
  [
    'inline-flex size-11 shrink-0 items-center justify-center',
    'rounded-full',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25',
  ].join(' '),
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed text-muted-foreground opacity-30 hover:bg-transparent',
        false: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      },
    },
    defaultVariants: { disabled: false },
  }
);

export const weekdayLabelVariants = cva(
  ['py-1.5 text-center text-xs font-medium uppercase tracking-wider'].join(' '),
  {
    variants: {
      isWeekend: {
        true: 'text-muted-foreground',
        false: 'text-muted-foreground',
      },
    },
    defaultVariants: { isWeekend: false },
  }
);

export type DayButtonVariants = VariantProps<typeof dayButtonVariants>;
export type MonthNavButtonVariants = VariantProps<typeof monthNavButtonVariants>;
export type WeekdayLabelVariants = VariantProps<typeof weekdayLabelVariants>;
export type DayState = NonNullable<DayButtonVariants['state']>;

export function getDayState(options: {
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isOtherMonth: boolean;
}): DayState {
  const { isSelected, isToday, isDisabled, isWeekend, isOtherMonth } = options;

  if (isDisabled) return 'disabled';
  if (isSelected) return 'selected';
  if (isToday) return 'today';
  if (isOtherMonth) return 'otherMonth';
  if (isWeekend) return 'weekend';
  return 'default';
}
