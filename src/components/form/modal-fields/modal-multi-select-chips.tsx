'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui';
import { getBudgetCategoryColorStyle } from '@/features/budgets/theme/budget-styles';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import type { ModalSelectOption } from './modal-select-field';

export interface ModalMultiSelectChipsProps {
  options: ModalSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  selectedGroupLabel?: string;
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
  selectedGroupLabel,
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

  const selectedChips = useMemo(() => {
    return value
      .map((id) => options.find((o) => o.value === id))
      .filter((o): o is ModalSelectOption => Boolean(o));
  }, [value, options]);

  const toggle = (id: string) => {
    onChange(
      selectedSet.has(id) ? value.filter((v) => v !== id) : Array.from(new Set([...value, id]))
    );
  };

  const onSelectAll = () => onChange(options.map((o) => o.value));
  const onClear = () => onChange([]);

  return (
    <div className={cn(s.categoryShell, 'space-y-3')} data-testid="modal-multi-select-chips">
      <div className={s.categoryToolbar}>
        <div className={s.categorySearchWrap}>
          <Search className={s.categorySearchIcon} aria-hidden />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder ?? t('fields.categories.searchPlaceholder')}
            disabled={disabled}
            className={s.categorySearchInput}
            autoComplete="off"
          />
        </div>
        <div className={s.categoryQuickActions} role="group">
          <button
            type="button"
            className={s.categoryQuickBtn}
            onClick={onSelectAll}
            disabled={disabled || !options.length}
          >
            {selectAllLabel ?? t('fields.categories.selectAll')}
          </button>
          <button
            type="button"
            className={s.categoryQuickBtn}
            onClick={onClear}
            disabled={disabled || !value.length}
          >
            {clearLabel ?? t('fields.categories.clear')}
          </button>
        </div>
      </div>

      {selectedChips.length > 0 ? (
        <section className={s.selectedSection}>
          <h3 className={s.selectedSectionTitle}>
            {selectedGroupLabel ?? t('fields.categories.selectedGroupLabel')}
          </h3>
          <ul className={s.selectedPillList}>
            {selectedChips.map((opt) => (
              <li key={opt.value} className={s.selectedPill}>
                {'color' in opt && typeof opt.color === 'string' ? (
                  <span
                    className={s.categoryColorDot}
                    style={getBudgetCategoryColorStyle(opt.color)}
                    aria-hidden
                  />
                ) : null}
                <span className={s.selectedPillLabel}>{opt.label}</span>
                <button
                  type="button"
                  className={s.selectedPillRemove}
                  onClick={() => toggle(opt.value)}
                  disabled={disabled}
                  aria-label={t('fields.categories.ariaRemoveChip', { label: opt.label })}
                >
                  <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className={s.categoryChipGrid}
        role="group"
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
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                className={cn(s.categoryChip, selected && s.categoryChipSelected)}
                onClick={() => toggle(option.value)}
              >
                {color ? (
                  <span
                    className={s.categoryColorDot}
                    style={getBudgetCategoryColorStyle(color)}
                    aria-hidden
                  />
                ) : null}
                <span className={s.categoryChipLabel}>{option.label}</span>
                {selected ? (
                  <Check className={s.categoryChipCheck} strokeWidth={2.5} aria-hidden />
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
