/**
 * DateField — grouped-row or stacked trigger.
 * `drawer` is for a page/closed parent. `inline` overlays the calendar on the
 * current sheet (no nested drawer, no in-flow expansion that forces scroll).
 */

'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, isValid, isSameDay, startOfDay } from 'date-fns';
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
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
  layout?: 'row' | 'stack';
  presentation?: 'drawer' | 'inline';
}

const OVERLAY_MARGIN = 12;
const OVERLAY_MAX_HEIGHT = 380;

type OverlayTriggerRect = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'width'>;
type OverlayViewport = { width: number; height: number };
type OverlayHostRect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>;

/** Vaul marks body siblings inert while a drawer is open — portal into the enclosing drawer. */
function calendarOverlayHost(from: HTMLElement | null): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return from?.closest('[data-slot="drawer-content"]') ?? document.body;
}

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
  const maxHeight = Math.min(OVERLAY_MAX_HEIGHT, frame.height * 0.62);
  let top = local.bottom + 8;
  if (top + maxHeight > frame.height - OVERLAY_MARGIN) {
    top = Math.max(OVERLAY_MARGIN, local.top - maxHeight - 8);
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<ReturnType<typeof overlayRectForTrigger> | null>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);

  const displayText = useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (!isValid(d)) return '';
    return isSameDay(startOfDay(d), startOfDay(new Date()))
      ? t('today')
      : format(d, 'P', { locale: dateLocale });
  }, [value, t, dateLocale]);

  const closeCalendar = () => setIsOpen(false);

  const toggleCalendar = () => {
    if (isOpen && presentation === 'inline') {
      closeCalendar();
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsOpen(true);
  };

  useLayoutEffect(() => {
    if (!isOpen || presentation !== 'inline') {
      setOverlay(null);
      setOverlayHost(null);
      return;
    }
    const node = wrapRef.current;
    if (!node) return;
    const update = () => {
      const host = calendarOverlayHost(node);
      setOverlayHost(host);
      const hostRect =
        host && host !== document.body ? host.getBoundingClientRect() : null;
      setOverlay(
        overlayRectForTrigger(
          node.getBoundingClientRect(),
          { width: window.innerWidth, height: window.innerHeight },
          hostRect
        )
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen, presentation]);

  useEffect(() => {
    if (!isOpen || presentation !== 'inline') return;
    const triggerButton = wrapRef.current?.querySelector('button');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCalendar();
      }
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      triggerButton?.focus();
    };
  }, [isOpen, presentation]);

  const trigger =
    layout === 'stack' ? (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">{resolvedLabel}</p>
        <button
          type="button"
          onClick={toggleCalendar}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`${resolvedLabel}: ${displayText || t('placeholder')}`}
          aria-invalid={error ? true : undefined}
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
      </div>
    ) : (
      <ModalSelectorTrigger
        label={resolvedLabel}
        value={displayText || t('placeholder')}
        valueMuted={!displayText}
        expanded={isOpen}
        onClick={toggleCalendar}
      />
    );

  const overlayInDrawer = Boolean(overlayHost && overlayHost !== document.body);
  const overlayPosition = overlayInDrawer ? 'absolute' : 'fixed';

  const overlayCalendar =
    overlayHost && presentation === 'inline' && isOpen && overlay
      ? createPortal(
          <>
            <button
              type="button"
              data-vaul-no-drag=""
              className={cn(
                overlayPosition,
                'inset-0 z-200 cursor-default bg-foreground/20 pointer-events-auto'
              )}
              aria-label={t('closeCalendar')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeCalendar}
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={resolvedLabel}
              tabIndex={-1}
              data-vaul-no-drag=""
              className={cn(
                overlayPosition,
                'z-201 overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-xl outline-none pointer-events-auto'
              )}
              style={{
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                maxHeight: overlay.maxHeight,
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <CalendarPanel compact value={value} onChange={onChange} onClose={closeCalendar} />
            </div>
          </>,
          overlayHost
        )
      : null;

  return (
    <div ref={wrapRef} className="space-y-1">
      {trigger}
      {overlayCalendar}
      {presentation === 'drawer' ? (
        <MobileCalendarDrawer
          value={value}
          onChange={onChange}
          isOpen={isOpen}
          onClose={closeCalendar}
        />
      ) : null}
      {error ? <ModalFieldError id={errorId} message={error} /> : null}
    </div>
  );
}
