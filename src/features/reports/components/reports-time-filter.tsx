'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stitchReports, stitchTransactions } from '@/styles/home-design-foundation';
import { FilterChip, FilterChipRow, FilterDrawer } from '@/components/ui/filters';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/fields/date-field';
import type { ReportsTimePreset } from '@/features/reports/utils/reporting-window';

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

  const applyCustom = () => {
    if (!draftStart || !draftEnd) return;
    if (new Date(draftStart).getTime() > new Date(draftEnd).getTime()) return;
    onChange('custom');
    onCustomApply(draftStart, draftEnd);
    setCustomOpen(false);
  };

  return (
    <>
      <div className={stitchReports.stickyFilterBar}>
        <FilterChipRow
          className={stitchReports.chipRow}
          aria-label={t('ariaLabel')}
          role="radiogroup"
        >
          {presets.map((p) => (
            <FilterChip
              key={p.id}
              role="radio"
              label={t(p.labelKey)}
              active={value === p.id}
              onClick={() => onChange(p.id)}
            />
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={value === 'custom'}
            onClick={() => openCustom()}
            className={cn(
              stitchTransactions.chipBase,
              'inline-flex items-center gap-1',
              value === 'custom' ? stitchTransactions.chipActive : stitchTransactions.chipInactive
            )}
          >
            <CalendarRange className="h-3 w-3 shrink-0" aria-hidden />
            {t('custom')}
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
              onChange={setDraftEnd}
            />
          </div>
          <Button
            type="button"
            className="min-h-11 w-full rounded-xl font-semibold"
            disabled={!draftStart || !draftEnd}
            onClick={applyCustom}
          >
            {t('apply')}
          </Button>
        </div>
      </FilterDrawer>
    </>
  );
}
