'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stitchReports, stitchTransactions } from '@/styles/home-design-foundation';
import { FilterChip, FilterChipRow, FilterDrawer } from '@/components/ui/filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReportsTimePreset } from '@/features/reports/utils/reporting-window';

interface ReportsTimeFilterProps {
  value: ReportsTimePreset;
  onChange: (v: ReportsTimePreset) => void;
  customRange: { start: string; end: string } | null;
  onCustomApply: (start: string, end: string) => void;
}

export function ReportsTimeFilter({
  value,
  onChange,
  customRange,
  onCustomApply,
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
        <FilterChipRow className={stitchReports.chipRow} aria-label={t('ariaLabel')}>
          {presets.map((p) => (
            <FilterChip
              key={p.id}
              label={t(p.labelKey)}
              active={value === p.id}
              onClick={() => onChange(p.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => openCustom()}
            className={cn(
              stitchTransactions.chipBase,
              'inline-flex items-center gap-1',
              value === 'custom' ? stitchTransactions.chipActive : stitchTransactions.chipInactive
            )}
          >
            <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('custom')}
          </button>
        </FilterChipRow>
      </div>

      <FilterDrawer
        open={customOpen}
        onOpenChange={setCustomOpen}
        title={t('customTitle')}
        contentClassName="border-border/25 bg-card/95 text-foreground"
      >
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reports-custom-start" className="text-xs text-muted-foreground">
                {t('from')}
              </Label>
              <Input
                id="reports-custom-start"
                type="date"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="rounded-xl border-border/35 bg-muted/85 text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reports-custom-end" className="text-xs text-muted-foreground">
                {t('to')}
              </Label>
              <Input
                id="reports-custom-end"
                type="date"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="rounded-xl border-border/35 bg-muted/85 text-foreground"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full rounded-xl bg-accent font-semibold text-white"
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
