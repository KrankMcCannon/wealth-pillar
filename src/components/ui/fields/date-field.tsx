/**
 * DateField — row trigger opens calendar (desktop popover / mobile drawer).
 */

'use client';

import { useState, useMemo } from 'react';
import { format, isValid, isSameDay, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileCalendarDrawer } from '../mobile-calendar-drawer';
import { DesktopCalendarPopover } from '../desktop-calendar-popover';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
}

export function DateField({
  value,
  onChange,
  error,
  label,
}: Readonly<DateFieldProps>) {
  const t = useTranslations('Forms.DateField');
  const tDrawer = useTranslations('Forms.DateDrawer');
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const resolvedLabel = label ?? t('label');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayText = useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (!isValid(d)) return '';
    return isSameDay(startOfDay(d), startOfDay(new Date()))
      ? tDrawer('presets.today')
      : format(d, 'dd/MM/yyyy', { locale: it });
  }, [value, tDrawer]);

  const triggerInner = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={stitchTransactionFormModal.selectorIconWrap}>
          <CalendarIcon className="h-5 w-5 text-[#b8c5ff]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className={stitchTransactionFormModal.selectorLabel}>{resolvedLabel}</p>
          <span
            className={
              displayText
                ? stitchTransactionFormModal.selectorValue
                : stitchTransactionFormModal.selectorValueMuted
            }
          >
            {displayText || t('placeholder')}
          </span>
        </div>
      </div>
      <ChevronRight className={stitchTransactionFormModal.selectorChevron} aria-hidden />
    </>
  );

  return (
    <div className="space-y-1">
      {isDesktop ? (
        <DesktopCalendarPopover
          value={value}
          onChange={onChange}
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        >
          <button
            type="button"
            data-state={isDrawerOpen ? 'open' : 'closed'}
            aria-expanded={isDrawerOpen}
            className={stitchTransactionFormModal.selectorTrigger}
          >
            {triggerInner}
          </button>
        </DesktopCalendarPopover>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            data-state={isDrawerOpen ? 'open' : 'closed'}
            aria-expanded={isDrawerOpen}
            className={stitchTransactionFormModal.selectorTrigger}
          >
            {triggerInner}
          </button>
          <MobileCalendarDrawer
            value={value}
            onChange={onChange}
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
        </>
      )}
      {error ? <p className={stitchTransactionFormModal.fieldError}>{error}</p> : null}
    </div>
  );
}
