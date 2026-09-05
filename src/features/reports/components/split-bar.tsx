'use client';

import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';

interface SplitBarProps {
  leftPercent: number;
  label: string;
  valuetext: string;
  leftClassName?: string;
  rightClassName?: string;
}

/** Two-segment meter. Length is the signal; colors come from semantic tokens. */
export function SplitBar({
  leftPercent,
  label,
  valuetext,
  leftClassName = 'bg-income',
  rightClassName = 'bg-expense',
}: SplitBarProps) {
  const left = Math.min(100, Math.max(0, leftPercent));

  return (
    <div
      className={cn(stitchReports.progressTrack, 'h-2')}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(left)}
      aria-valuetext={valuetext}
    >
      <div className="flex h-full w-full">
        <div className={cn('h-full', leftClassName)} style={{ width: `${left}%` }} />
        <div className={cn('h-full min-w-0 flex-1', rightClassName)} />
      </div>
    </div>
  );
}
