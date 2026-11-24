/**
 * DateField — grouped-row or stacked trigger.
 * `drawer` is for a page/closed parent. `inline` overlays the calendar on the
 * current sheet (no nested drawer, no in-flow expansion that forces scroll).
 */

'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { format, isValid, isSameDay, parseISO, startOfDay } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { MobileCalendarDrawer } from '../mobile-calendar-drawer';
import { CalendarPanel } from '../calendar-panel';
import { ModalSelectorTrigger } from '@/components/form/modal-fields/modal-selector-trigger';
import { ModalFieldError } from '@/components/form/modal-fields/modal-field-error';
import { cn } from '@/lib/utils';

export interface DateFieldProps {
  value: string;
  defaultMonth?: string | undefined;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
  layout?: 'row' | 'stack';
  presentation?: 'drawer' | 'inline';
}

const OVERLAY_MARGIN = 12;
const OVERLAY_MAX_HEIGHT = 400;

type OverlayTriggerRect = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'width'>;
type OverlayViewport = { width: number; height: number };
type OverlayHostRect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>;

export function overlayRectForTrigger(
  trigger: OverlayTriggerRect,
  viewport: OverlayViewport,
  host?: OverlayHostRect | null
): { top: number; left: number; width: number; maxHeight: number } {
  const frame = host ? { width: host.width, height: host.height } : viewport;
  const local = host
    ? {
        top: trigger.top - host.top,
        bottom: trigger.bottom - host.top,
        left: trigger.left - host.left,
        width: trigger.width,
      }
    : trigger;
  const width = Math.min(Math.max(local.width, 280), frame.width - OVERLAY_MARGIN * 2);
  const maxHeight = Math.min(OVERLAY_MAX_HEIGHT, frame.height - OVERLAY_MARGIN * 2);
  let top = local.bottom + 8;
  if (top + maxHeight > frame.height - OVERLAY_MARGIN) {
    top = Math.max(OVERLAY_MARGIN, local.top - maxHeight - 8);
  }
  if (top + maxHeight > frame.height - OVERLAY_MARGIN) {
    top = Math.max(OVERLAY_MARGIN, Math.round((frame.height - maxHeight) / 2));
  }
  let left = local.left;
  if (left + width > frame.width - OVERLAY_MARGIN) {
    left = frame.width - OVERLAY_MARGIN - width;
  }
  left = Math.max(OVERLAY_MARGIN, left);
  return { top, left, width, maxHeight };
}

export function DateField({
  value,
  defaultMonth,
  onChange,
  error,
  label,
  layout = 'row',
  presentation = 'drawer',
}: Readonly<DateFieldProps>) {
  const t = useTranslations('Forms.DateField');
  const locale = useLocale();
  const dateLocale = locale === 'it' ? it : enUS;
  const resolvedLabel = label ?? t('label');
  const [isOpen, setIsOpen] = useState(false);
  const errorId = `${useId()}-error`;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayText = useMemo(() => {
    if (!value) return '';
    // A financial form value is a calendar day, not a UTC instant. Keep this
    // in step with CalendarPanel so selecting, reopening, and submitting a
    // YYYY-MM-DD value always refers to the same local day.
    const d = parseISO(value);
    if (!isValid(d)) return '';
    return isSameDay(startOfDay(d), startOfDay(new Date()))
      ? t('today')
      : format(d, 'P', { locale: dateLocale });
  }, [value, t, dateLocale]);

  const closeCalendar = () => setIsOpen(false);

  const triggerButton =
    layout === 'stack' ? (
      <button
        type="button"
        ref={triggerRef}
        {...(presentation === 'drawer' ? { onClick: () => setIsOpen(true) } : {})}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${resolvedLabel}: ${displayText || t('placeholder')}`}
        aria-describedby={error ? errorId : undefined}
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
    ) : (
      <ModalSelectorTrigger
        ref={triggerRef}
        label={resolvedLabel}
        value={displayText || t('placeholder')}
        valueMuted={!displayText}
        expanded={isOpen}
        {...(presentation === 'drawer' ? { onClick: () => setIsOpen(true) } : {})}
      />
    );
  const trigger = (
    <>
      {layout === 'stack' ? (
        <p className="text-sm font-medium text-foreground">{resolvedLabel}</p>
      ) : null}
      {presentation === 'inline' ? (
        <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
      ) : (
        triggerButton
      )}
    </>
  );

  return (
    <Dialog.Root open={presentation === 'inline' && isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        {trigger}
        {presentation === 'inline' ? (
          <Dialog.Portal>
            <Dialog.Overlay
              data-testid="calendar-overlay"
              data-vaul-no-drag=""
              className="fixed inset-0 z-200 bg-foreground/20 backdrop-blur-xs"
              onPointerDown={(event) => {
                if (event.button === 0) closeCalendar();
              }}
            />
            <Dialog.Content
              data-testid="date-field-calendar"
              aria-label={resolvedLabel}
              aria-modal="true"
              data-vaul-no-drag=""
              className="fixed left-1/2 top-1/2 z-201 h-auto max-h-[min(90dvh,460px)] w-[min(calc(100vw-2rem),340px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl outline-none"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                triggerRef.current?.focus();
              }}
              onPointerDown={(event) => {
                if (event.button === 0) event.stopPropagation();
              }}
            >
              <Dialog.Title className="sr-only">{resolvedLabel}</Dialog.Title>
              <CalendarPanel
                compact
                defaultMonth={defaultMonth}
                value={value}
                onChange={onChange}
                onClose={closeCalendar}
              />
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
        {presentation === 'drawer' ? (
          <MobileCalendarDrawer
            value={value}
            defaultMonth={defaultMonth}
            onChange={onChange}
            isOpen={isOpen}
            onClose={closeCalendar}
          />
        ) : null}
        {error ? <ModalFieldError id={errorId} message={error} /> : null}
      </div>
    </Dialog.Root>
  );
}
