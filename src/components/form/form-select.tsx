'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib';
import { Layers, Search, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectValue } from '../ui';
import { formStyles } from './theme/form-styles';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface FormSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  renderIcon?: (option: SelectOption) => React.ReactNode;
  /** Small uppercase caption above the selected value */
  captionLabel?: string;
  /** Leading icon inside the circular slot (defaults to a neutral glyph) */
  leadingIcon?: React.ReactNode;
}

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  className,
  renderIcon,
  captionLabel,
  leadingIcon,
}: Readonly<FormSelectProps>) {
  const t = useTranslations('Forms.Select');
  const [searchValue, setSearchValue] = React.useState('');
  const resolvedPlaceholder = placeholder ?? t('placeholder');
  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;

    const lowerSearch = searchValue.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerSearch) ||
        option.value.toLowerCase().includes(lowerSearch)
    );
  }, [searchValue, options]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchValue('');
    }
  };

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        type="button"
        disabled={disabled}
        className={cn(stitchTransactionFormModal.selectorTrigger, className)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={stitchTransactionFormModal.selectorIconWrap}>
            {leadingIcon ?? <Layers className="h-5 w-5 text-[#b8c5ff]/80" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            {captionLabel ? (
              <p className={stitchTransactionFormModal.selectorLabel}>{captionLabel}</p>
            ) : null}
            <span
              aria-hidden
              className={
                selectedOption
                  ? stitchTransactionFormModal.selectorValue
                  : stitchTransactionFormModal.selectorValueMuted
              }
            >
              {selectedOption?.label ?? resolvedPlaceholder}
            </span>
            <span className="sr-only">
              <SelectValue placeholder={resolvedPlaceholder} />
            </span>
          </div>
        </div>
        <ChevronRight className={stitchTransactionFormModal.selectorChevron} aria-hidden />
      </SelectPrimitive.Trigger>
      <SelectContent className={formStyles.select.content}>
        <div className={formStyles.select.searchWrap}>
          <div className={formStyles.select.searchFieldWrap}>
            <Search className={formStyles.select.searchIcon} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={formStyles.select.searchInput}
            />
          </div>
        </div>

        <div className={formStyles.select.optionsWrap}>
          {filteredOptions.length === 0 ? (
            <div className={formStyles.select.empty}>{t('empty')}</div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled ?? false}
              >
                <div className={formStyles.select.optionRow}>
                  {renderIcon?.(option)}
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

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

export function sortSelectOptions(options: SelectOption[], locale: string = 'it'): SelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, locale));
}
