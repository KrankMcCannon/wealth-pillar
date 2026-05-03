'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stitchReports, stitchTransactions } from '@/styles/home-design-foundation';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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

  const presets: { id: ReportsTimePreset; labelKey: 'monthly' | 'weekly' | 'yearly' }[] = [
    { id: 'monthly', labelKey: 'monthly' },
    { id: 'weekly', labelKey: 'weekly' },
    { id: 'yearly', labelKey: 'yearly' },
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
        <div className={stitchReports.chipRow} role="tablist" aria-label={t('ariaLabel')}>
          {presets.map((p) => {
            const active = value === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(p.id)}
                className={cn(
                  stitchTransactions.chipBase,
                  active ? stitchTransactions.chipActive : stitchTransactions.chipInactive
                )}
              >
                {t(p.labelKey)}
              </button>
            );
          })}
          <button
            type="button"
            role="tab"
            aria-selected={value === 'custom'}
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
        </div>
      </div>

      <Drawer open={customOpen} onOpenChange={setCustomOpen}>
        <DrawerContent className="border-[#3359c5]/25 bg-[#0b1f4f]/95 text-[#e6ecff]">
          <DrawerHeader>
            <DrawerTitle className="text-left text-lg font-semibold text-[#e6ecff]">
              {t('customTitle')}
            </DrawerTitle>
            <DrawerDescription className="sr-only">{t('customTitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reports-custom-start" className="text-xs text-[#9fb0d7]">
                  {t('from')}
                </Label>
                <Input
                  id="reports-custom-start"
                  type="date"
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  className="rounded-xl border-[#3359c5]/35 bg-[#11295f]/85 text-[#e6ecff]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reports-custom-end" className="text-xs text-[#9fb0d7]">
                  {t('to')}
                </Label>
                <Input
                  id="reports-custom-end"
                  type="date"
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="rounded-xl border-[#3359c5]/35 bg-[#11295f]/85 text-[#e6ecff]"
                />
              </div>
            </div>
            <Button
              type="button"
              className="w-full rounded-xl bg-[#183166] font-semibold text-white"
              disabled={!draftStart || !draftEnd}
              onClick={applyCustom}
            >
              {t('apply')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
