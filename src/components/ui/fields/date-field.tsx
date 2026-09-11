/**
 * DateField — trigger opens the shared calendar drawer.
 * `row` is the form-modal settings row; `stack` is label-above (filters, compact ranges).
 */

'use client';

import { useState, useMemo } from 'react';
import { format, isValid, isSameDay, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MobileCalendarDrawer } from '../mobile-calendar-drawer';
import { ModalSelectorTrigger } from '@/components/form/modal-fields/modal-selector-trigger';
import { ModalFieldError } from '@/components/form/modal-fields/modal-field-error';
import { cn } from '@/lib/utils';

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
  layout?: 'row' | 'stack';
}

export function DateField({
  value,
  onChange,
  error,
  label,
  layout = 'row',
}: Readonly<DateFieldProps>) {
  const t = useTranslations('Forms.DateField');
  const resolvedLabel = label ?? t('label');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayText = useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (!isValid(d)) return '';
    return isSameDay(startOfDay(d), startOfDay(new Date()))
      ? t('today')
      : format(d, 'dd/MM/yyyy', { locale: it });
  }, [value, t]);

  const openCalendar = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsDrawerOpen(true);
  };

  const trigger =
    layout === 'stack' ? (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">{resolvedLabel}</p>
        <button
          type="button"
          onClick={openCalendar}
          aria-label={`${resolvedLabel}: ${displayText || t('placeholder')}`}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/35 bg-muted/80 px-3 text-left text-sm font-medium transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35'
          )}
        >
          <span className={displayText ? 'text-foreground' : 'text-muted-foreground'}>
            {displayText || t('placeholder')}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </div>
    ) : (
      <ModalSelectorTrigger
        label={resolvedLabel}
        value={displayText || t('placeholder')}
        valueMuted={!displayText}
        onClick={openCalendar}
      />
    );

  return (
    <div className="space-y-1">
      {trigger}
      <MobileCalendarDrawer
        value={value}
        onChange={onChange}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      {error ? <ModalFieldError message={error} /> : null}
    </div>
  );
}
