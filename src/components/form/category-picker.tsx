'use client';

import { useId, useMemo, useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ModalWrapper, ModalFooter } from '@/components/ui/modal-wrapper';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from './form-modal-styles';

export type CategoryPickerOption = {
  value: string;
  label: string;
  color?: string | null;
  description?: string;
};

/** Same searchable list and trigger for transaction and budget categories. */
export function CategoryPicker({
  options,
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  disabled = false,
  className,
}: {
  options: CategoryPickerOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  multiple?: boolean;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  const t = useTranslations('Forms.CategorySelect');
  const common = useTranslations('Common');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const id = useId();
  const selected = options.filter((option) => value.includes(option.value));
  const summary = selected.map((option) => option.label).join(', ');
  const filtered = useMemo(
    () =>
      options
        .filter((option) =>
          `${option.label} ${option.description ?? ''}`
            .toLocaleLowerCase(locale)
            .includes(search.trim().toLocaleLowerCase(locale))
        )
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [options, search, locale]
  );
  function close() {
    setOpen(false);
    setSearch('');
  }
  return (
    <>
      <button
        type="button"
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label ?? placeholder ?? t('placeholder')}
        disabled={disabled}
        className={cn(s.selectorTrigger, className)}
        onClick={() => setOpen(true)}
      >
        {label ? <span className={s.selectorLabel}>{label}</span> : null}
        <span className={cn(summary ? s.selectorValue : s.selectorValueMuted, 'truncate')}>
          {summary || placeholder || t('placeholder')}
        </span>
        <ChevronRight className={s.selectorChevron} aria-hidden />
      </button>
      <ModalWrapper
        isOpen={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={label ?? t('placeholder')}
        nested
      >
        <div className="flex min-h-0 flex-col">
          <div className="relative mx-4 mb-3 shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              aria-label={t('searchPlaceholder')}
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={s.categoryPickerSearchInput}
              autoComplete="off"
            />
          </div>
          <div
            id={id}
            role="listbox"
            aria-label={label ?? t('placeholder')}
            aria-multiselectable={multiple || undefined}
            className="max-h-[min(55dvh,24rem)] min-h-0 overflow-y-auto overscroll-contain px-2 pb-2"
            onKeyDown={(event) => {
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
              const items = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')
              );
              const current = items.indexOf(document.activeElement as HTMLButtonElement);
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? items.length - 1
                    : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
                      items.length;
              event.preventDefault();
              items[next]?.focus();
            }}
          >
            {filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={value.includes(option.value)}
                key={option.value}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                onClick={() => {
                  onChange(
                    multiple
                      ? value.includes(option.value)
                        ? value.filter((key) => key !== option.value)
                        : [...value, option.value]
                      : [option.value]
                  );
                  if (!multiple) close();
                }}
              >
                <span
                  className="size-3 shrink-0 rounded-full border border-foreground/20"
                  style={{ backgroundColor: option.color ?? undefined }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 break-words">
                  <span className="block text-base font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {value.includes(option.value) ? (
                  <Check className="size-5 shrink-0" aria-hidden />
                ) : null}
              </button>
            ))}
            {!filtered.length ? <p className={s.categoryEmpty}>{t('empty')}</p> : null}
          </div>
        </div>
        {multiple ? (
          <ModalFooter>
            <button type="button" className={s.footer.dualSubmit} onClick={close}>
              {common('confirm')}
            </button>
          </ModalFooter>
        ) : null}
      </ModalWrapper>
    </>
  );
}
