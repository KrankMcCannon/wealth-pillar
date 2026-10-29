'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui';
import { getBudgetCategoryColorStyle } from '@/features/budgets/theme/budget-styles';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import type { ModalSelectOption } from './modal-select-field';

export interface ModalMultiSelectChipsProps {
  options: ModalSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  allGroupLabel?: string;
  selectAllLabel?: string;
  clearLabel?: string;
  emptyLabel?: string;
}

export function ModalMultiSelectChips({
  options,
  value,
  onChange,
  disabled,
  searchPlaceholder,
  allGroupLabel,
  selectAllLabel,
  clearLabel,
  emptyLabel,
}: Readonly<ModalMultiSelectChipsProps>) {
  const t = useTranslations('Budgets.FormModal');
  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchValue]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (id: string) => {
    onChange(
      selectedSet.has(id) ? value.filter((v) => v !== id) : Array.from(new Set([...value, id]))
    );
  };

  return (
    <div className={s.categoryPicker} data-testid="modal-multi-select-chips">
      <div className={s.categoryPickerToolbar}>
        <div className={s.select.searchFieldWrap}>
          <Search className={s.categoryPickerSearchIcon} aria-hidden />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder ?? t('fields.categories.searchPlaceholder')}
            disabled={disabled}
            autoComplete="off"
            className={s.categoryPickerSearchInput}
          />
        </div>
        <div className={s.footer.dualRow}>
          <button
            type="button"
            className={s.footer.dualCancel}
            onClick={() => onChange(options.map((o) => o.value))}
            disabled={disabled || !options.length}
          >
            {selectAllLabel ?? t('fields.categories.selectAll')}
          </button>
          <button
            type="button"
            className={s.footer.dualCancel}
            onClick={() => onChange([])}
            disabled={disabled || !value.length}
          >
            {clearLabel ?? t('fields.categories.clear')}
          </button>
        </div>
      </div>

      <div
        className={s.categoryPickerList}
        role="group"
        data-testid="modal-multi-select-list"
        aria-label={allGroupLabel ?? t('fields.categories.allGroupLabel')}
      >
        {filteredOptions.length === 0 ? (
          <p className={s.categoryEmpty}>{emptyLabel ?? t('fields.categories.empty')}</p>
        ) : (
          filteredOptions.map((option) => {
            const selected = selectedSet.has(option.value);
            const color =
              'color' in option && typeof option.color === 'string' ? option.color : undefined;
            return (
              <label key={option.value} className={s.multiUser.row}>
                <span className={s.multiUser.userRow}>
                  {color ? (
                    <span
                      className={s.categoryColorDot}
                      style={getBudgetCategoryColorStyle(color)}
                      aria-hidden
                    />
                  ) : null}
                  <span className={s.multiUser.name}>{option.label}</span>
                </span>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggle(option.value)}
                  disabled={disabled}
                  className={s.multiUser.checkbox}
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
