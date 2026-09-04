'use client';

import { cn } from '@/lib/utils';
import { stitchBudgets } from '@/styles/home-design-foundation';

export function getBudgetProgressbarProps({ percent, label }: { percent: number; label: string }): {
  role: 'progressbar';
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-valuenow': number;
  'aria-valuetext': string;
  'aria-label': string;
} {
  const clamped = Math.min(100, Math.max(0, percent));
  return {
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(clamped),
    'aria-valuetext': `${Math.round(percent)}%`,
    'aria-label': label,
  };
}

interface BudgetProgressBarProps {
  readonly percent: number;
  readonly label: string;
  readonly fillClassName: string;
  readonly trackClassName?: string;
  readonly limitMarkerLeftPct?: number | null;
}

export function BudgetProgressBar({
  percent,
  label,
  fillClassName,
  trackClassName,
  limitMarkerLeftPct,
}: BudgetProgressBarProps) {
  const widthPct = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn(stitchBudgets.progressTrack, trackClassName)}
      {...getBudgetProgressbarProps({ percent, label })}
    >
      <div
        className={cn('relative z-1 h-full min-h-[8px] rounded-full', fillClassName)}
        style={{ width: `${percent > 100 ? 100 : widthPct}%` }}
      />
      {limitMarkerLeftPct != null ? (
        <div
          className={cn(stitchBudgets.progressLimitMarker, 'z-10')}
          style={{ left: `${limitMarkerLeftPct}%`, transform: 'translateX(-50%)' }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
