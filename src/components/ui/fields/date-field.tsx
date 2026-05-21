/**
 * DateField — row trigger opens calendar drawer.
 */

'use client';

import { useState, useMemo } from 'react';
import { format, isValid, isSameDay, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MobileCalendarDrawer } from '../mobile-calendar-drawer';
import { ModalSelectorTrigger } from '@/components/form/modal-fields/modal-selector-trigger';
import { ModalFieldError } from '@/components/form/modal-fields/modal-field-error';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
}

export function DateField({ value, onChange, error, label }: Readonly<DateFieldProps>) {
  const t = useTranslations('Forms.DateField');
  const tDrawer = useTranslations('Forms.DateDrawer');
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

  return (
    <div className="space-y-1">
      <ModalSelectorTrigger
        label={resolvedLabel}
        value={displayText || t('placeholder')}
        valueMuted={!displayText}
        icon={<CalendarIcon className={s.selectorIcon} aria-hidden />}
        onClick={() => setIsDrawerOpen(true)}
      />
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
