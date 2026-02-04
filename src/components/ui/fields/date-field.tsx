/**
 * DateField - Modern Date Picker Field
 *
 * Universal date input with custom calendar drawer for all devices
 *
 * Features:
 * - Italian locale (DD/MM/YYYY display)
 * - API-compatible format (YYYY-MM-DD)
 * - Min/max date constraints
 * - Manual text input support
 * - Clear button
 * - Full accessibility
 * - Modern bottom drawer UI for all devices
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, parse, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { FormField } from '@/components/form';
import { Input, Button } from '@/components/ui';
import { MobileCalendarDrawer } from '../mobile-calendar-drawer';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { calendarTriggerVariants } from '@/lib/utils';

export interface DateFieldProps {
  /** Current date value (YYYY-MM-DD format for API compatibility) */
  value: string;
  /** Callback when date changes (returns YYYY-MM-DD format) */
  onChange: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field label */
  label?: string;
}

/**
 * DateField - Universal date input field with modern calendar drawer
 *
 * Uses custom calendar drawer for all devices with:
 * - Beautiful bottom drawer UI
 * - Touch-optimized interactions
 * - Manual text entry (DD/MM/YYYY)
 * - Quick preset shortcuts
 * - Full keyboard navigation
 *
 * @example
 * ```tsx
 * <DateField
 *   value={formData.date}
 *   onChange={(date) => setFormData({ ...formData, date })}
 *   label="Data transazione"
 *   required
 * />
 * ```
 */
export function DateField({
  value,
  onChange,
  error,
  required = false,
  label = 'Data',
}: Readonly<DateFieldProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const formattedValue = useMemo(() => {
    if (value && isValid(new Date(value))) {
      return format(new Date(value), 'dd/MM/yyyy', { locale: it });
    }
    return '';
  }, [value]);
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(formattedValue);

  // Handle manual text input
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setDraftValue(newValue);

      // Try to parse DD/MM/YYYY format
      if (newValue.length === 10) {
        const parsed = parse(newValue, 'dd/MM/yyyy', new Date(), { locale: it });
        if (isValid(parsed)) {
          onChange(format(parsed, 'yyyy-MM-dd'));
        }
      } else if (newValue === '') {
        onChange('');
      }
    },
    [onChange]
  );

  // Handle input blur - reset to valid format if invalid
  const handleInputBlur = useCallback(() => {
    if (value && isValid(new Date(value))) {
      const date = new Date(value);
      setDraftValue(format(date, 'dd/MM/yyyy', { locale: it }));
    } else if (!value) {
      setDraftValue('');
    }
    setIsEditing(false);
  }, [value]);

  // Clear date
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setDraftValue('');
      setIsEditing(false);
    },
    [onChange]
  );

  return (
    <FormField label={label || 'Data'} required={required} error={error}>
      <div className={calendarDrawerStyles.input.group}>
        {/* Text Input with Clear Button */}
        <div className={calendarDrawerStyles.input.wrapper}>
          <Input
            value={isEditing ? draftValue : formattedValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => {
              setIsEditing(true);
              setDraftValue(formattedValue);
            }}
            placeholder="GG/MM/AAAA"
            className={calendarDrawerStyles.input.field}
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={calendarDrawerStyles.input.clearButton}
              aria-label="Cancella data"
            >
              <X className={calendarDrawerStyles.input.clearIcon} />
            </button>
          )}
        </div>

        {/* Calendar Trigger Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsDrawerOpen(true)}
          className={calendarTriggerVariants({ active: isDrawerOpen })}
        >
          <CalendarIcon className={calendarDrawerStyles.input.triggerIcon} />
          <span className="sr-only">Apri calendario</span>
        </Button>
      </div>

      {/* Modern Calendar Drawer (All Devices) */}
      <MobileCalendarDrawer
        value={value}
        onChange={onChange}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </FormField>
  );
}
