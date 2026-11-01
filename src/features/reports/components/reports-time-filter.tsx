'use client';

import { useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stitchReports, stitchTransactions } from '@/styles/home-design-foundation';
import { FilterChip, FilterChipRow, FilterDrawer } from '@/components/ui/filters';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/fields/date-field';
import { useMounted } from '@/hooks/use-mounted';
import {
  isValidReportsRange,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';

interface ReportsTimeFilterProps {
  value: ReportsTimePreset;
  onChange: (v: ReportsTimePreset) => void;
  customRange: { start: string; end: string } | null;
  onCustomApply: (start: string, end: string) => void;
  children?: ReactNode;
}

export function ReportsTimeFilter({
  value,
  onChange,
  customRange,
  onCustomApply,
  children,
}: ReportsTimeFilterProps) {
  const t = useTranslations('Reports.TimeFilter');
  const formatter = useFormatter();
  const mounted = useMounted();
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(customRange?.start ?? '');
  const [draftEnd, setDraftEnd] = useState(customRange?.end ?? '');

  const presets: { id: ReportsTimePreset; labelKey: 'weekly' | 'monthly' | 'ytd' | 'yearly' }[] = [
    { id: 'yearly', labelKey: 'yearly' },
    { id: 'ytd', labelKey: 'ytd' },
    { id: 'monthly', labelKey: 'monthly' },
    { id: 'weekly', labelKey: 'weekly' },
  ];

  const openCustom = () => {
    setDraftStart(customRange?.start ?? '');
    setDraftEnd(customRange?.end ?? '');
    setCustomOpen(true);
  };

  const invalidRange = Boolean(draftStart && draftEnd && draftStart > draftEnd);

  const applyCustom = () => {
    if (!isValidReportsRange({ start: draftStart, end: draftEnd })) return;
    if (new Date(draftStart).getTime() > new Date(draftEnd).getTime()) return;
    onChange('custom');
    onCustomApply(draftStart, draftEnd);
    setCustomOpen(false);
  };

  const extendedActive = value === 'custom' || value === 'last_year' || value === 'last_month';
  const extendedLabel =
    value === 'custom' && isValidReportsRange(customRange)
      ? formatter.dateTimeRange(
          new Date(`${customRange.start}T12:00:00`),
          new Date(`${customRange.end}T12:00:00`),
          { day: 'numeric', month: 'short', year: 'numeric' }
        )
      : value === 'last_year' || value === 'last_month'
        ? t(value)
        : t('custom');

  return (
    <>
      <div className={stitchReports.stickyFilterBar}>
        <FilterChipRow className={stitchReports.chipRow} aria-label={t('ariaLabel')} role="group">
          {presets.map((p) => (
            <FilterChip
              key={p.id}
              label={t(p.labelKey)}
              active={value === p.id}
              disabled={!mounted}
              onClick={() => onChange(p.id)}
            />
          ))}
          <button
            type="button"
            disabled={!mounted}
            aria-pressed={extendedActive}
            aria-haspopup="dialog"
            aria-expanded={customOpen}
            onClick={() => openCustom()}
            className={cn(
              stitchTransactions.chipBase,
              'inline-flex items-center gap-1',
              extendedActive ? stitchTransactions.chipActive : stitchTransactions.chipInactive
            )}
          >
            <CalendarRange className="h-3 w-3 shrink-0" aria-hidden />
            {extendedLabel}
          </button>
        </FilterChipRow>
        {children}
      </div>

      <FilterDrawer
        open={customOpen}
        onOpenChange={setCustomOpen}
        title={t('customTitle')}
        contentClassName="border-border/25 bg-card text-foreground"
      >
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-wrap gap-2" aria-label={t('quickRanges')}>
            {(['last_month', 'last_year'] as const).map((preset) => (
              <Button
                key={preset}
                variant="outline"
                aria-pressed={value === preset}
                onClick={() => {
                  onChange(preset);
                  setCustomOpen(false);
                }}
              >
                {t(preset)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <DateField
              layout="stack"
              presentation="inline"
              label={t('from')}
              value={draftStart}
              onChange={setDraftStart}
            />
            <DateField
              layout="stack"
              presentation="inline"
              label={t('to')}
              value={draftEnd}
              defaultMonth={draftStart || undefined}
              error={invalidRange ? t('invalidRange') : undefined}
              onChange={setDraftEnd}
            />
          </div>
          <Button
            type="button"
            className="min-h-11 w-full rounded-xl font-semibold"
            disabled={!isValidReportsRange({ start: draftStart, end: draftEnd })}
            onClick={applyCustom}
          >
            {t('apply')}
          </Button>
        </div>
      </FilterDrawer>
    </>
  );
}
