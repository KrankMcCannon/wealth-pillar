'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { formModalStyles as s } from './form-modal-styles';
import { ModalSearchInput } from './modal-fields/modal-search-input';

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
  /** Label on the left of the grouped row */
  captionLabel?: string;
  /** Search UI. Defaults to on when there are 6+ options. */
  searchable?: boolean | undefined;
}

export function isSelectSearchable(
  optionCount: number,
  searchable?: boolean | undefined
): boolean {
  return searchable ?? optionCount >= 6;
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
  searchable,
}: Readonly<FormSelectProps>) {
  const t = useTranslations('Forms.Select');
  const [searchValue, setSearchValue] = React.useState('');
  const resolvedPlaceholder = placeholder ?? t('placeholder');
  const selectedOption = options.find((o) => o.value === value);
  const showSearch = isSelectSearchable(options.length, searchable);

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
      {...(value ? { value } : {})}
      onValueChange={(next) => {
        if (!next) return;
        onValueChange(next);
      }}
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        type="button"
        disabled={disabled}
        className={cn(s.selectorTrigger, className)}
      >
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          {captionLabel ? <p className={s.selectorLabel}>{captionLabel}</p> : null}
          <span aria-hidden className={selectedOption ? s.selectorValue : s.selectorValueMuted}>
            {selectedOption?.label ?? resolvedPlaceholder}
          </span>
          <span className="sr-only">
            <SelectValue placeholder={resolvedPlaceholder} />
          </span>
        </div>
        <ChevronRight className={s.selectorChevron} aria-hidden />
      </SelectPrimitive.Trigger>
      <SelectContent className={cn('bg-popover text-popover-foreground', s.select.content)}>
        {showSearch ? (
          <div
            className={s.select.searchWrap}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalSearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            />
          </div>
        ) : null}

        <div className={s.select.optionsWrap}>
          {filteredOptions.length === 0 ? (
            <div className={s.select.empty}>{t('empty')}</div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled ?? false}
                className={s.select.item}
              >
                <div className={s.select.optionRow}>
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
