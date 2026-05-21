/**
 * Quick Presets Component
 *
 * Fast date selection with common presets
 */

'use client';

import { subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { presetButtonVariants } from '@/lib/utils/date-drawer-variants';
import { cn } from '@/lib/utils';

interface PresetConfig {
  labelKey:
    | 'today'
    | 'yesterday'
    | 'daysAgo7'
    | 'daysAgo30'
    | 'weekStart'
    | 'monthStart'
    | 'yearStart';
  getValue: () => Date;
  id: string;
}

const DATE_PRESETS: PresetConfig[] = [
  { id: 'today', labelKey: 'today', getValue: () => new Date() },
  { id: 'yesterday', labelKey: 'yesterday', getValue: () => subDays(new Date(), 1) },
  { id: '7-days-ago', labelKey: 'daysAgo7', getValue: () => subDays(new Date(), 7) },
  { id: '30-days-ago', labelKey: 'daysAgo30', getValue: () => subDays(new Date(), 30) },
  {
    id: 'week-start',
    labelKey: 'weekStart',
    getValue: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  },
  { id: 'month-start', labelKey: 'monthStart', getValue: () => startOfMonth(new Date()) },
  { id: 'year-start', labelKey: 'yearStart', getValue: () => startOfYear(new Date()) },
];

export interface QuickPresetsProps {
  selectedDate?: Date | undefined;
  onSelect: (date: Date) => void;
  className?: string;
}

export function QuickPresets({ selectedDate, onSelect, className }: Readonly<QuickPresetsProps>) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section
      className={cn(calendarDrawerStyles.presets.section, className)}
      aria-label={t('Forms.DateDrawer.presetsAria')}
    >
      <h3 className={calendarDrawerStyles.presets.title}>
        <Zap className={calendarDrawerStyles.presets.icon} />
        {t('Forms.DateDrawer.presetsTitle')}
      </h3>

      <div className={calendarDrawerStyles.presets.container}>
        {DATE_PRESETS.map((preset) => {
          const presetDate = preset.getValue();
          const isActive = selectedDate ? isSameDay(presetDate, selectedDate) : false;
          const label = t(`Forms.DateDrawer.presets.${preset.labelKey}`);

          const formattedDate = new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(presetDate);

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(presetDate)}
              className={cn(
                calendarDrawerStyles.presets.button.base,
                presetButtonVariants({ active: isActive })
              )}
              aria-label={t('Forms.DateDrawer.presetAria', { label, date: formattedDate })}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { DATE_PRESETS };
export type { PresetConfig };
