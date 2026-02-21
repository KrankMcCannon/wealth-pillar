/**
 * Quick Presets Component
 *
 * Fast date selection with common presets
 * Optimized for mobile with vertical list layout
 *
 * Features:
 * - Italian preset labels
 * - Active state highlighting
 * - Touch-optimized button sizes
 * - Common financial date patterns
 */

'use client';

import { subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { presetButtonVariants } from '@/lib/utils/date-drawer-variants';
import { cn } from '@/lib/utils';

/**
 * Preset configuration type
 */
interface PresetConfig {
  /** Translation key for preset label */
  labelKey:
    | 'today'
    | 'yesterday'
    | 'daysAgo7'
    | 'daysAgo30'
    | 'weekStart'
    | 'monthStart'
    | 'yearStart';
  /** Function to calculate the date */
  getValue: () => Date;
  /** Unique identifier */
  id: string;
}

/**
 * Available date presets
 * Common patterns for financial applications
 */
const DATE_PRESETS: PresetConfig[] = [
  {
    id: 'today',
    labelKey: 'today',
    getValue: () => new Date(),
  },
  {
    id: 'yesterday',
    labelKey: 'yesterday',
    getValue: () => subDays(new Date(), 1),
  },
  {
    id: '7-days-ago',
    labelKey: 'daysAgo7',
    getValue: () => subDays(new Date(), 7),
  },
  {
    id: '30-days-ago',
    labelKey: 'daysAgo30',
    getValue: () => subDays(new Date(), 30),
  },
  {
    id: 'week-start',
    labelKey: 'weekStart',
    getValue: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  },
  {
    id: 'month-start',
    labelKey: 'monthStart',
    getValue: () => startOfMonth(new Date()),
  },
  {
    id: 'year-start',
    labelKey: 'yearStart',
    getValue: () => startOfYear(new Date()),
  },
];

export interface QuickPresetsProps {
  /**
   * Currently selected date (for highlighting active preset)
   */
  selectedDate?: Date;

  /**
   * Callback when preset is selected
   */
  onSelect: (date: Date) => void;

  /**
   * Size variant
   * @default "mobile"
   */
  size?: 'mobile' | 'desktop';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * QuickPresets - Fast date selection buttons
 *
 * Provides quick access to commonly used dates
 * Optimized for mobile with large touch targets
 *
 * @example
 * ```tsx
 * <QuickPresets
 *   selectedDate={selectedDate}
 *   onSelect={handleDateSelect}
 * />
 * ```
 */
export function QuickPresets({
  selectedDate,
  onSelect,
  size = 'mobile',
  className,
}: Readonly<QuickPresetsProps>) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section
      className={cn(
        calendarDrawerStyles.presets.section,
        size === 'desktop' && calendarDrawerStyles.desktop.presets.section,
        className
      )}
      aria-label={t('Forms.DateDrawer.presetsAria')}
    >
      {/* Section Title */}
      <h3
        className={cn(
          calendarDrawerStyles.presets.title,
          size === 'desktop' && calendarDrawerStyles.desktop.presets.title
        )}
      >
        <Zap className={calendarDrawerStyles.presets.icon} />
        {t('Forms.DateDrawer.presetsTitle')}
      </h3>

      {/* Preset Buttons */}
      <div
        className={cn(
          calendarDrawerStyles.presets.container,
          size === 'desktop' && calendarDrawerStyles.desktop.presets.container
        )}
      >
        {DATE_PRESETS.map((preset) => {
          const presetDate = preset.getValue();
          const isActive = selectedDate ? isSameDay(presetDate, selectedDate) : false;
          const label = t(`Forms.DateDrawer.presets.${preset.labelKey}`);

          // Format date for aria-label
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
                presetButtonVariants({ size, active: isActive })
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

/**
 * Export presets for use in other components
 */
export { DATE_PRESETS };
export type { PresetConfig };
