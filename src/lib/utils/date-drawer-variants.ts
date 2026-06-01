/**
 * Date drawer CVA variants — single source of truth for calendar day/nav styling.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const dayButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'h-12 w-12 min-h-12 min-w-12',
    'rounded-xl',
    'text-base font-semibold tabular-nums',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  ].join(' '),
  {
    variants: {
      state: {
        default: [
          'text-foreground',
          'bg-card',
          'hover:bg-primary hover:text-primary-foreground',
          'hover:scale-110 hover:shadow-md',
          'active:scale-95',
          'border border-border',
        ].join(' '),
        selected: [
          'bg-primary text-white',
          'ring-4 ring-primary/20',
          'shadow-lg shadow-primary/40',
          'hover:bg-primary/90 hover:scale-110',
          'font-bold scale-105',
          'border-0',
        ].join(' '),
        today: [
          'bg-card',
          'text-primary',
          'ring-2 ring-primary',
          'font-bold',
          'hover:bg-primary hover:text-primary-foreground hover:scale-110',
          'border-0',
        ].join(' '),
        disabled: [
          'text-muted-foreground/50',
          'bg-muted/30',
          'cursor-not-allowed',
          'hover:bg-muted/30 hover:scale-100',
          'opacity-40',
          'border border-border',
        ].join(' '),
        weekend: [
          'text-foreground',
          'bg-card',
          'hover:bg-primary hover:text-primary-foreground',
          'hover:scale-110',
          'border border-border',
        ].join(' '),
        otherMonth: [
          'text-muted-foreground/50',
          'bg-muted/30',
          'hover:bg-muted/50 hover:text-muted-foreground',
          'hover:scale-105',
          'border border-border',
        ].join(' '),
      },
    },
    compoundVariants: [
      { state: 'selected', className: 'shadow-xl shadow-primary/40' },
      { state: 'today', className: 'ring-[3px]' },
    ],
    defaultVariants: { state: 'default' },
  }
);

export const monthNavButtonVariants = cva(
  [
    'shrink-0 h-11 w-11',
    'inline-flex items-center justify-center',
    'rounded-full',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      disabled: {
        true: [
          'opacity-30',
          'cursor-not-allowed',
          'bg-primary/10 text-primary',
          'hover:bg-primary/10 hover:text-primary hover:scale-100',
          'hover:shadow-none',
        ].join(' '),
        false: [
          'bg-primary/10 text-primary',
          'hover:bg-primary hover:text-white',
          'hover:scale-110 hover:shadow-lg hover:shadow-primary/30',
          'active:scale-95',
        ].join(' '),
      },
    },
    defaultVariants: { disabled: false },
  }
);

export const weekdayLabelVariants = cva(
  ['text-xs font-bold uppercase', 'text-center py-2', 'tracking-wider'].join(' '),
  {
    variants: {
      isWeekend: {
        true: 'text-primary/80',
        false: 'text-primary',
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
