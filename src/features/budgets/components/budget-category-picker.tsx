'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui';
import { getBudgetCategoryColorStyle } from '@/styles/system';
import { stitchBudgetFormModal } from '@/styles/home-design-foundation';

export type BudgetCategoryOption = {
  value: string;
  label: string;
  color?: string | null;
};

export interface BudgetCategoryPickerProps {
  options: BudgetCategoryOption[];
  selectedIds: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
}

export function BudgetCategoryPicker({
  options,
  selectedIds,
  searchValue,
  onSearchChange,
  onToggleCategory,
  onSelectAll,
  onClearSelection,
  disabled,
}: Readonly<BudgetCategoryPickerProps>) {
  const t = useTranslations('Budgets.FormModal');
  const s = stitchBudgetFormModal;

  const filteredOptions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchValue]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedChips = useMemo(() => {
    return selectedIds
      .map((id) => options.find((o) => o.value === id))
      .filter((o): o is BudgetCategoryOption => Boolean(o));
  }, [selectedIds, options]);

  const total = options.length;
  const selectedCount = selectedIds.length;

  return (
    <div className={cn(s.categoryShell, 'space-y-3')} data-testid="budget-category-picker">
      <div className={s.categoryToolbar}>
        <div className={s.categorySearchWrap}>
          <Search className={s.categorySearchIcon} aria-hidden />
          <Input
            id="budget-category-search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('fields.categories.searchPlaceholder')}
            disabled={disabled}
            className={s.categorySearchInput}
            autoComplete="off"
            aria-label={t('fields.categories.searchPlaceholder')}
          />
        </div>
        <div className={s.categoryQuickActions} role="group" aria-label={t('fields.categories.quickActionsLabel')}>
          <button
            type="button"
            className={s.categoryQuickBtn}
            onClick={onSelectAll}
            disabled={disabled || !total}
          >
            {t('fields.categories.selectAll')}
          </button>
          <button
            type="button"
            className={s.categoryQuickBtn}
            onClick={onClearSelection}
            disabled={disabled || !selectedCount}
          >
            {t('fields.categories.clear')}
          </button>
        </div>
      </div>

      {selectedChips.length > 0 ? (
        <section
          className={s.selectedSection}
          aria-labelledby="budget-selected-categories-heading"
        >
          <h3 id="budget-selected-categories-heading" className={s.selectedSectionTitle}>
            {t('fields.categories.selectedGroupLabel')}
          </h3>
          <ul className={s.selectedPillList}>
            {selectedChips.map((opt) => (
              <li key={opt.value} className={s.selectedPill}>
                <span
                  className={s.categoryColorDot}
                  style={getBudgetCategoryColorStyle(opt.color ?? undefined)}
                  aria-hidden
                />
                <span className={s.selectedPillLabel}>{opt.label}</span>
                <button
                  type="button"
                  className={s.selectedPillRemove}
                  onClick={() => onToggleCategory(opt.value)}
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
        aria-label={t('fields.categories.allGroupLabel')}
      >
        {filteredOptions.length === 0 ? (
          <p className={s.categoryEmpty}>{t('fields.categories.empty')}</p>
        ) : (
          filteredOptions.map((option) => {
            const selected = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? t('fields.categories.ariaToggleRemove', { label: option.label })
                    : t('fields.categories.ariaToggleAdd', { label: option.label })
                }
                className={cn(s.categoryChip, selected && s.categoryChipSelected)}
                onClick={() => onToggleCategory(option.value)}
              >
                <span
                  className={s.categoryColorDot}
                  style={getBudgetCategoryColorStyle(option.color ?? undefined)}
                  aria-hidden
                />
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
