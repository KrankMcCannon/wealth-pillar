'use client';

import * as React from 'react';
import { cn } from '@/lib';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ResponsiveSelect, type ResponsiveSelectOption } from '../ui/responsive-select';
import { formStyles } from './theme/form-styles';
import { selectStyles } from '@/styles/system';

/**
 * Form Select Component
 *
 * Enhanced select component with optional icon support and sorting.
 * Designed for use in forms with consistent styling.
 * Now uses ResponsiveSelect for a consistent experience across devices.
 *
 * @example
 * ```tsx
 * <FormSelect
 *   value={formData.category}
 *   onValueChange={(value) => handleChange('category', value)}
 *   options={categories}
 *   placeholder="Seleziona categoria"
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SelectOption = ResponsiveSelectOption;

export interface FormSelectProps {
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Array of options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Function to render custom icon for option */
  renderIcon?: (option: SelectOption) => React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  className,
  renderIcon,
}: Readonly<FormSelectProps>) {
  const t = useTranslations('Forms.Select');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  // Find the selected option to display its label in the trigger
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <ResponsiveSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={t('searchPlaceholder')}
      emptyMessage={t('empty')}
      className={className}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={cn(selectStyles.trigger, formStyles.select.trigger, className)}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption ? (
              <>
                {renderIcon?.(selectedOption)}
                {selectedOption.icon && <span>{selectedOption.icon}</span>}
                <span className="truncate text-foreground">{selectedOption.label}</span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{resolvedPlaceholder}</span>
            )}
          </div>
          <ChevronDown className={selectStyles.icon} />
        </button>
      }
      renderOption={(option) => (
        <div className="flex items-center gap-2 overflow-hidden">
          {renderIcon?.(option)}
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          <span className="truncate">{option.label}</span>
        </div>
      )}
    />
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts array of items to SelectOption format
 */
export function toSelectOptions<
  T extends { id?: string; key?: string; label?: string; name?: string },
>(
  items: T[],
  getValue: (item: T) => string = (item) => item.id || item.key || '',
  getLabel: (item: T) => string = (item) => item.label || item.name || ''
): SelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
  }));
}

/**
 * Sorts select options alphabetically by label
 */
export function sortSelectOptions(options: SelectOption[], locale: string = 'it'): SelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, locale));
}
